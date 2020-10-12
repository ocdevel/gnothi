import os, pdb, math, datetime, traceback
from os.path import exists
from tqdm import tqdm
from common.database import session
import common.models as M
from common.utils import utcnow, vars, is_test
from ml_tools import Similars, CleanText, CosineEstimator
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
        self.vecs_user = np.vstack(vecs).astype(np.float32)

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

        # .unmark().only_english()
        df['text'] = CleanText(df.text.tolist())\
            .strip_html()\
            .only_ascii()\
            .fix_punct()\
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
        vecs = Similars(texts).embed().value()
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
        # adjust books' cosine similarity; not by too much, we want to stick to the 0-1 range still
        # and do so for users-scores much more than global-scores. Global-scores are just an overall rating
        # system, and not meant to have too much sway.
        df['adjustments'] = df.user_score * .3 \
            + df.global_score * .03

    def predict(self):
        df, vecs_user, vecs_books, user_id = self.df, self.vecs_user, self.vecs_books, self.user_id
        fixt = fixtures.load_books(user_id)
        if fixt is not None:
            logger.info("Returning fixture predictions")
            return fixt

        if vecs_user.shape[0] > 5:
            vecs_user = Similars(vecs_user).cluster(algo='agglomorative').value()
        adjustments = df.adjustments.values

        dnn = CosineEstimator(vecs_user, vecs_books)
        dnn.fit_cosine()
        if df.any_rated.sum() > 3:
            dnn.fit_adjustments(adjustments)

        preds = dnn.predict()
        fixtures.save_books(user_id, preds)
        return preds

    def recommend(self, n_recs=30):
        logger.info("Recommend books")
        df = self.df
        df['dist'] = self.predict()
        # dupes by title in libgen
        self.df = df[~df.user_rated].sort_values('dist') \
            .drop_duplicates('title') \
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
        shelf = shelf.to_dict('records')
        sess.execute(
            postgresql.insert(M.Bookshelf.__table__)
                .values(shelf)
                .on_conflict_do_nothing(index_elements=[M.Bookshelf.book_id, M.Bookshelf.user_id])
        )

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
