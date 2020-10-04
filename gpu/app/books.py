# https://github.com/tensorflow/tensorflow/issues/2117
import tensorflow as tf
config = tf.compat.v1.ConfigProto()
config.gpu_options.allow_growth = True
session = tf.compat.v1.Session(config=config)

from tensorflow.keras import backend as K
from tensorflow.keras.layers import Input, Dense
from tensorflow.keras.models import Model, load_model
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.optimizers import Adam

import os, pdb, math, datetime, traceback
from os.path import exists
from tqdm import tqdm
from common.database import session
import common.models as M
from common.utils import utcnow, vars
from lefnire_ml_utils import Similars, cleantext
from common.fixtures import fixtures
from box import Box
import numpy as np
import pandas as pd
from sqlalchemy import text
from psycopg2.extras import Json as jsonb
from sqlalchemy.dialects import postgresql
import logging
logger = logging.getLogger(__name__)

# Whether to load full Libgen DB, or just self-help books
ALL_BOOKS = True
libgen_dir = "/storage/libgen"
libgen_file = f"{libgen_dir}/{vars.ENVIRONMENT}_{'all' if ALL_BOOKS else 'psych'}"  # '.ext
if not os.path.exists(libgen_dir): os.mkdir(libgen_dir)
paths = Box(
    vecs=f"{libgen_file}.npy",
    df=f"{libgen_file}.df",
    autoencoder=f"{libgen_file}.tf",
    compressed=f"{libgen_file}.min.npy",
)

# Dim-reduce vecs_books & vecs_user. Only doing because len(vecs_books)>290k & it breaks everything system RAM & GPU
# RAM (would prefer raw cosine). Experiment with dims; keeping high to preserve accuracy. If not using, adjust DNN
# predictor dims.
# [400, 100]: val_loss: 0.0027 - val_decoder_out_loss: 2.4608e-04 - val_dist_out_loss: 0.0025
# [400, 60]: val_loss: 0.0026 - val_decoder_out_loss: 2.9463e-04 - val_dist_out_loss: 0.0023
# [400, 60] no normalization: val_loss: 0.0739 - val_decoder_out_loss: 0.0692 - val_dist_out_loss: 0.0047
# [400, 60] batch_norm: val_loss: 0.0581 - val_decoder_out_loss: 0.0565 - val_dist_out_loss: 0.0016
# Prefer the last. Learned-normalization (higher decode loss because input->output dist isn't normalized).
ae_kwargs = dict(
    save_load_path=paths.autoencoder,
    preserve_cosine=True,
    dims=[400, 60],
    batch_norm=True
)

class Books(object):
    def __init__(self, sess, user_id):
        self.sess = sess  # comes from caller, and must be closed after
        self.user_id = str(user_id)

        self.vecs_user = None
        self.df = None
        self.vecs_books = None
        self.model = None

    def prune_books(self):
        self.sess.execute("""
        delete from books where 
            amazon is null and id not in (select book_id from bookshelf);
        """)
        self.sess.commit()

    def load_vecs_user(self):
        logger.info("Load user_vecs")
        uid = dict(uid=self.user_id)
        sess = self.sess
        # don't run if ran recently (notice the inverse if & comparator, simpler)
        if sess.execute(text(f"""
        select 1 from users 
        where id=:uid and last_books > {utcnow} - interval '10 minutes' 
        """), uid).fetchone():
            return None
        sess.execute(text(f"""
        update users set last_books={utcnow} where id=:uid
        """), uid)
        sess.commit()

        entries = sess.execute(text("""
        select c.vectors from cache_entries c
        inner join entries e on e.id=c.entry_id 
            and e.user_id=:uid
            and array_length(c.vectors, 1) > 0
        order by e.created_at desc;
        """), uid).fetchall()
        profile = sess.execute(text("""
        select vectors from cache_users 
            where user_id=:uid
            and array_length(vectors, 1) > 0
        """), uid).fetchone()

        vecs = []
        if profile and profile.vectors:
            vecs += profile.vectors
        for e in entries:
            if e.vectors: vecs += e.vectors
        if not vecs:
            # fixme empty vectors
            return None
        return np.vstack(vecs).astype(np.float32)

    def load_df(self):
        if exists(paths.df):
            logger.info("Load books.df")
            return pd.read_feather(paths.df)\
                .drop(columns=['index'])\
                .sort_values('id')\
                .set_index('id', drop=False)

        # invalidate embeddings, they're out of sync
        try: os.remove(paths.vecs)
        except: pass

        logger.info("Load books MySQL")

        psych_topics = ""
        if not ALL_BOOKS:
            # for-sure psych. See tmp/topics.txt, or libgen.sql topics(lang='en')
            psych_topics = 'psychology|self-help|therapy'
            # good other psych topics, either mis-categorized or other
            psych_topics += '|anthropology|social|religion'
            psych_topics += '|^history|^education'
            psych_topics = f"and t.topic_descr regexp '{psych_topics}'"

        sql = f"""
        select="select u.ID, u.Title, u.Author, d.descr, t.topic_descr
        from updated u
            inner join description d on d.md5=u.MD5
            inner join topics t on u.Topic=t.topic_id
                -- TODO later more languages; but I think it's only Russian in Libgen?
                and t.lang='en'
        where u.Language = 'English'
            -- Make sure there's some content to work with
            and (length(d.descr) + length(u.Title)) > 200
            {psych_topics}
        """
        with session('books') as sessb:
            df = pd.read_sql(sql, sessb.bind)
        df = df.drop_duplicates(['Title', 'Author'])

        logger.info(f"n_books before cleanup {df.shape[0]}")
        logger.info("Remove HTML")
        broken = '(\?\?\?|\#\#\#)'  # russian / other FIXME better way to handle
        df = df[~(df.Title + df.descr).str.contains(broken)] \
            .drop_duplicates(['Title', 'Author'])  # TODO reconsider

        df['descr'] = cleantext.multiple(df.descr.tolist(), [
            cleantext.strip_html,
            cleantext.fix_punct,
            cleantext.only_ascii,
            cleantext.multiple_whitespace,
            cleantext.unmark
        ])

        # books = books[books.clean.apply(lambda x: detect(x) == 'en')]
        logger.info(f"n_books after cleanup {df.shape[0]}")

        df = df.rename(columns=dict(
            ID='id',
            descr='text',
            Title='title',
            Author='author',
            topic_descr='topic',
        ))

        # drop dupes, keep longest desc
        df['txt_len'] = df.text.str.len()
        df = df.sort_values('txt_len', ascending=False)\
            .drop_duplicates('id')\
            .drop(columns=['txt_len'])\
            .sort_values('id')

        logger.info(f"Save books.df")
        # Error: feather does not support serializing a non-default index for the index; you can .reset_index() to make the index into column(s)
        # I get ^ even though no index has yet been set. Have to manually reset_index() anyway
        df.reset_index().to_feather(paths.df)
        # call self, which returns newly-saved df (ensures consistent order, etc)
        return self.load_df()

    def _npfile(self, path_, write=None):
        if write is not None:
            with open(path_, 'wb') as f:
                logger.info(f"Save {path_}")
                np.save(f, write)
        elif exists(path_):
            with open(path_, 'rb') as f:
                logger.info(f"Load {path_}")
                return np.load(f)
        return None

    def load_vecs_books(self):
        # Try loading autoencoded vecs first. If they exist, then the auto-encoder exists too, and let's save
        # ourselves resources (.npy file-loading, GPU RAM, etc)
        vecs = self._npfile(paths.compressed)
        if vecs is not None:
            return vecs

        # If autoencoding not yet done, but intermediate full-vectors step is, load that then autoencode
        vecs = self._npfile(paths.vecs)
        if vecs is None:
            # No embeddings at all yet, generate them
            df = self.df
            logger.info(f"Embedding {df.shape[0]} entries")
            texts = (df.title + '\n' + df.text).tolist()
            vecs = Similars(texts).embed().value()
            self._npfile(paths.vecs, write=vecs)

        # Then autoencode them since our operations are so heavy; cosine in particular, maxes GPU RAM easily
        vecs = Similars(vecs).autoencode(**ae_kwargs).value()
        self._npfile(paths.compressed, write=vecs)

        return vecs

    def load_scores(self):
        logger.info("Load book_scores")
        df, sess, user_id = self.df, self.sess, self.user_id
        books = M.Bookshelf.books_with_scores(sess, user_id)
        for k, fillna in [('user_score', 0), ('global_score', 0), ('user_rated', False), ('any_rated', False)]:
            # df.loc[books.index, k] = books[k]
            df[k] = books[k]  # this assumes k->k map properly on index
            df[k] = df[k].fillna(fillna)

    def compute_dists(self):
        logger.info("Compute distances")
        df, vu, vb = self.df, self.vecs_user, self.vecs_books

        # First, clean up the vectors some. vecs_books is already clean (normalized and autoencoded via
        # load_vecs_books), do so now with vecs_user.
        vu = Similars(vu).autoencode(**ae_kwargs).value()
        self.vecs_user = vu  # used anywhere anymore?
        dist = Similars(vu, vb).cosine(abs=True).value()

        # Take best cluster-score for every book
        dist = dist.min(axis=0)
        # 0f29e591: minmax_scale(dist). norm_out=True works better
        # then map back onto books, so they're back in order (pandas index-matching)

        # Push highly-rated books up, low-rated books down. Do that even stronger for user's own ratings.
        # Using negative-score because cosine DISTANCE (less is better)
        df['dist'] = dist
        df['dist'] = df.dist \
            + (df.dist.std() * -df.global_score / 2.) \
            + (df.dist.std() * -df.user_score)
        assert not df.dist.isna().any(), "Messed up merging shelf/books.dist by index"

    def pretrain(self):
        logger.info("Pre-train model")
        x = self.vecs_books
        y = self.df.dist
        # linear+mse for smoother distances, what we have here? where sigmoid+binary_crossentropy for
        # harder decision boundaries, which we don't have?
        act, loss = 'relu', 'mse'  # trying relu since using cosine(abs=True)

        input = Input(shape=(x.shape[1],))
        m = Dense(ae_kwargs.dims[-1]//2, activation='elu')(input)
        m = Dense(1, activation=act)(m)
        m = Model(input, m)
        m.compile(
            # metrics=['accuracy'],
            loss=loss,
            optimizer=Adam(learning_rate=.0001),
        )

        self.es = EarlyStopping(monitor='val_loss', mode='min', patience=3, min_delta=.0001)
        m.fit(
            x, y,
            epochs=50,
            batch_size=128,
            shuffle=True,
            callbacks=[self.es],
            validation_split=.3,
        )
        self.model = m

    def finetune(self):
        logger.info("Fine-tune model")
        x, df = self.vecs_books, self.df
        if df.any_rated.sum() < 3: return

        # Train harder on shelved books
        # K.set_value(m.optimizer.learning_rate, 0.0001)  # alternatively https://stackoverflow.com/a/60420156/362790
        x = x[df.any_rated]
        y = df[df.any_rated].dist
        self.model.fit(
            x, y,
            epochs=2,  # too many epochs overfits (eg to CBT). Maybe adjust LR *down*, or other?
            batch_size=16,
            callbacks=[self.es],
            shuffle=True,
            validation_split=.3  # might not have enough data?
        )

    def predict(self):
        user_id = self.user_id
        fixt = fixtures.load_books(user_id)
        if fixt is not None:
            logger.info("Returning fixture predictions")
            return fixt
        self.pretrain()
        self.finetune()
        preds = self.model.predict(self.vecs_books)
        fixtures.save_books(user_id, preds)
        return preds

    def recommend(self, n_recs=30):
        logger.info("Recommend books")
        df = self.df
        df['dist'] = self.predict()
        # dupes by title in libgen
        # r = books.sort_values('dist')\
        self.df = df[~df.user_rated].sort_values('dist') \
            .drop_duplicates('title', keep='first') \
            .iloc[:n_recs]

    def save_results(self):
        logger.info("Save results")
        df, sess, user_id = self.df, self.sess, self.user_id

        uid = dict(uid=user_id)
        sess.execute(text("""
        delete from bookshelf where user_id=:uid and shelf='ai';
        """), uid)
        sess.commit()

        # pd.to_sql doesn't support "on conflict", and we could hit a race-condition by doing select-ids -> insert
        # where not in ids.
        books = df["id title text author topic".split()].to_dict('records')
        sess.execute(
            postgresql.insert(M.Book.__table__)
            .values(books)
            .on_conflict_do_nothing(index_elements=[M.Book.id])
        )

        shelf = df[['id', 'dist']].rename(columns=dict(id='book_id', dist='score'))
        shelf['user_id'] = user_id
        shelf['shelf'] = 'ai'
        shelf.to_sql('bookshelf', sess.bind, if_exists='append', index=False)

    def run(self):
        self.prune_books()
        self.vecs_user = self.load_vecs_user()
        if self.vecs_user is None:
            # no jobs to run
            return {}

        self.df = self.load_df()
        self.vecs_books = self.load_vecs_books()
        self.load_scores()
        self.compute_dists()
        self.recommend()
        self.save_results()


def run_books(user_id):
    with session() as sess:
        b = Books(sess, user_id)
        return b.run()


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--uid")
    parser.add_argument("--jid")
    args = parser.parse_args()

    def fn():
        run_books(args.uid)
        return {}
    M.Job.wrap_job(args.jid, 'books', fn)
