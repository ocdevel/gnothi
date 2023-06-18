from app.utils import logging
import os, pdb, math, datetime, traceback
from os.path import exists
from tqdm import tqdm
from common.database import session
import common.models as M
from common.utils import vars, is_test
from ml_tools import Similars, CleanText#, CosineEstimator
from common.fixtures import fixtures
from box import Box
import numpy as np
import pandas as pd
from sqlalchemy import text
from psycopg2.extras import Json as jsonb
from sqlalchemy.dialects import postgresql as psql
logger = logging.getLogger(__name__)
from app.nlp import nlp_

# Whether to load full Libgen DB, or just self-help books
libgen_dir = "/storage/libgen"
if not exists(libgen_dir): os.mkdir(libgen_dir)
libgen_file = f"{libgen_dir}/{vars.ENVIRONMENT}"  # .<ext>
paths = Box(
    df=f"{libgen_file}.df",
    vecs=f"{libgen_file}.npy",
    dnn=f"{libgen_file}.tf"
)

class Books(object):
    def __init__(self, sess, user_id):
        self.sess = sess  # comes from caller, and must be closed after
        self.user_id = str(user_id)

        self.vecs_user = None
        self.vecs_books = None
        self.df = None

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
        where id=:uid and last_books > now() - interval '10 minutes'
        """), uid).fetchone():
            return None
        sess.execute(text(f"""
        update users set last_books=now() where id=:uid
        """), uid)
        sess.commit()

        entries = sess.execute(text("""
        select ce.vectors
        from tags t
        inner join entries_tags et on et.tag_id=t.id
            and t.user_id=:uid
            and t.ai=true
        inner join entries e on e.id=et.entry_id
        inner join cache_entries ce on ce.entry_id=e.id 
            and array_length(ce.vectors, 1) > 0
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
        vecs = np.vstack(vecs).astype(np.float32)
        self.vecs_user = vecs

    def load_df(self):
        if exists(paths.df):
            logger.info("Load books.df")
            self.df = pd.read_feather(paths.df)\
                .drop(columns=['index'])\
                .set_index('id', drop=False)
            return

        # invalidate embeddings, they're out of sync
        try: os.remove(paths.vecs)
        except: pass

        logger.info("Load books MySQL")
        # 58fbd36a: limit to psychology topics
        sql = f"""
        select u.ID, u.Title, u.Author, d.descr, t.topic_descr
        from updated u
            inner join description d on d.md5=u.MD5
            inner join topics t on u.Topic=t.topic_id
                -- later more languages; but I think it's only Russian in Libgen?
                and t.lang='en'
        where u.Language = 'English'
            -- Make sure there's some content to work with
            and length(d.descr) > 200 and length(u.Title) > 1
        """
        with session('books') as sessb:
            df = pd.read_sql(sql, sessb.bind)
        df = df.rename(columns=dict(
            ID='id',
            descr='text',
            Title='title',
            Author='author',
            topic_descr='topic',
        ))

        logger.info(f"n_books before cleanup {df.shape[0]}")
        logger.info("Remove HTML")

        # some books are literally just ########
        df = df[~(df.title + df.text).str.contains('(\?\?\?|\#\#\#)')]

        df['text'] = CleanText(df.text.tolist())\
            .strip_html()\
            .only_ascii()\
            .multiple_whitespace()\
            .value()
        df['txt_len'] = df.text.str.len()
        # Ensure has content. Drop dupes, keeping those w longest description
        df = df[df.txt_len > 150]\
            .sort_values('txt_len', ascending=False)\
            .drop_duplicates('id')\
            .drop_duplicates(['title', 'author'])\
            .drop(columns=['txt_len'])
        # books = books[books.clean.apply(lambda x: detect(x) == 'en')]
        logger.info(f"n_books after cleanup {df.shape[0]}")

        logger.info(f"Save books.df")
        # Error: feather does not support serializing a non-default index for the index; you can .reset_index() to make the index into column(s)
        # I get ^ even though no index has yet been set. Have to manually reset_index() anyway
        df = df.reset_index()
        df.to_feather(paths.df)
        # call self, which returns newly-saved df (ensures consistent order, etc)
        self.load_df()

    def load_vecs_books(self):
        if exists(paths.vecs):
            self.vecs_books = np.load(paths.vecs)#, mmap_mode='r')
            return
        # No embeddings at all yet, generate them
        df = self.df
        logger.info(f"Embedding {df.shape[0]} entries")
        texts = (df.title + '\n' + df.text).tolist()
        vecs = nlp_.sentence_encode(texts)
        np.save(paths.vecs, vecs)
        self.load_vecs_books()

    def load_scores(self):
        logger.info("Load book_scores")
        df, sess, user_id = self.df, self.sess, self.user_id
        books = M.Bookshelf.books_with_scores(sess, user_id)
        for k, fillna in [('user_score', 0.), ('global_score', 0.), ('user_rated', False), ('any_rated', False)]:
            # df.loc[books.index, k] = books[k]
            df[k] = books[k]  # this assumes k->k map properly on index
            df[k] = df[k].fillna(fillna)

    def grad(self, user, books, scores, step):
        # TODO use cupy (installed with spacy anyway). cupy.asarray(cpu_arr); gpu_arr.get()
        mask = scores != 0
        books, scores = books[mask], scores.values[mask]
        # return user + np.mean((books * scores[:, np.newaxis] * step), axis=0)
        for (b, s) in zip(books, scores):
            user = user + (b * s * step)
        return user
    
    def save_user(self, vecs_user):
        # Save vecs_user, the full user.mean for later use in groups/user matching
        db, uid = self.sess, self.user_id
        mean = vecs_user.mean(axis=0)
        mean = [mean.tolist()]
        stmt = psql.insert(M.CacheUser)\
            .values(user_id=uid, vectors=mean)
        db.execute(stmt.on_conflict_do_update(
            index_elements=['user_id'],
            set_=dict(vectors=stmt.excluded.vectors)
        ))
        db.commit()
    
    def predict(self):
        df, vecs_user, vecs_books, user_id = self.df, self.vecs_user, self.vecs_books, self.user_id
        fixt = fixtures.load_books(user_id)
        if fixt is not None:
            logger.info("Returning fixture predictions")
            return fixt

        # TODO fiddle with these step-sizes, or make them adaptive to n_ratings
        vecs_user = self.grad(vecs_user, vecs_books, df.user_score, .01)
        vecs_user = self.grad(vecs_user, vecs_books, df.global_score, .001)
        preds = self.cosine_(vecs_user, vecs_books)
        
        self.save_user(vecs_user)
        
        fixtures.save_books(user_id, preds)
        return preds

    def cosine_(self, user, books):
        # If very many entries, cluster so that user represented by a handful of centroids.
        # More performant, and less noise
        if user.shape[0] > 30:
            user = Similars(user).cluster(algo='kmeans').value()

        # TODO refactor, copied from ml-tools/cosine_estimator
        batch = 100
        def gen_dists():
            for i in range(0, books.shape[0], batch):
                c = Similars(user, books[i:i + batch]).normalize()
                yield c.cosine(abs=True).value().min(axis=0).squeeze()
        return np.hstack([d for d in gen_dists()])

    def cosine(self):
        return self.cosine_(self.vecs_user, self.vecs_books)

    def recommend(self, n_recs=30):
        logger.info("Recommend books")
        df, sess, user_id = self.df, self.sess, self.user_id
        df['user_id'] = user_id  # for db-insert

        # Cosine: create a direct-mapping of user entries to books via cosine similarity, mostly for
        # sanity-check
        # AI: Recommend books based on user preferences (thumbs, other-user-liked, etc)
        for shelf in ['cosine', 'ai']:
            logger.info(f"Books: recommend_{shelf}")
            df['score'] = {'cosine': self.cosine, 'ai': self.predict}[shelf]()

            logger.info("Save results")
            sess.execute(text("""
            delete from bookshelf where user_id=:uid and shelf=:shelf
            """), dict(uid=user_id, shelf=shelf))
            sess.commit()

            # Top-k, dedupe titles in libgen
            df_ = df[~df.user_rated].copy()\
                .sort_values('score')\
                .drop_duplicates('title')\
                .iloc[:n_recs]

            # Upsert books. We don't want to store all libgen DB in our own, too big; so we
            # only store recommends. They may be deleted if not interacted with, that's fine since we'll
            # upsert them again if they show up again.
            vals = df_[["id", "title", "text", "author", "topic"]]
            sess.execute(
                psql.insert(M.Book)
                .values(vals.to_dict('records'))
                .on_conflict_do_nothing(index_elements=[M.Book.id])
            )
            sess.commit()

            # Upsert user bookshelf
            vals = df_[['id', 'user_id', 'score']].rename(columns={'id': 'book_id'})
            vals['shelf'] = shelf
            sess.execute(
                psql.insert(M.Bookshelf)
                    .values(vals.to_dict('records'))
                    .on_conflict_do_nothing(index_elements=[M.Bookshelf.book_id, M.Bookshelf.user_id])
            )
            sess.commit()

    def run(self):
        self.prune_books()
        self.load_vecs_user()
        if self.vecs_user is None:
            # no jobs to run
            return {}

        self.load_df()
        self.load_vecs_books()
        self.load_scores()
        self.recommend()


def run_books(user_id):
    with session() as sess:
        b = Books(sess, user_id)
        return b.run()
