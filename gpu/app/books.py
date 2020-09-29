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
from sklearn import preprocessing as pp

import logging
logger = logging.getLogger(__name__)


def load_books_df(sess):
    # sort asc since that's how we mapped to vecs in first place (order_values)
    df = pd.read_sql("select * from books order by id asc", sess.bind)
    if df.shape[0]:
        return df.set_index('id', drop=False)

    logger.info("Load books MySQL")
    FIND_PROBLEMS = False
    ALL_BOOKS = False

    # for-sure psych. See tmp/topics.txt, or libgen.sql topics(lang='en')
    psych_topics = 'psychology|self-help|therapy'
    # good other psych topics, either mis-categorized or other
    psych_topics += '|anthropology|social|religion'
    psych_topics += '|^history|^education'

    sql = Box(
        select="select u.ID, u.Title, u.Author, d.descr, t.topic_descr",
        body="""
            from updated u
                inner join description d on d.md5=u.MD5
                inner join topics t on u.Topic=t.topic_id
                    and t.lang='en'
            where u.Language = 'English'
                and title not regexp 'sams|teach yourself'  -- remove junk
                and (length(d.descr) + length(u.Title)) > 200
            and u.ID not in ('62056','72779','111551','165602','165606','239835','240399','272945','310202','339718','390651','530739','570667','581466','862274','862275','879029','935149','1157279','1204687','1210652','1307307','1410416','1517634','1568907','1592543','2103755','2128089','2130515','2187329','2270690','2270720','2275684','2275804','2277017','2284616','2285559','2314405','2325313','2329959','2340421','2347272','2374055','2397307','2412259','2420958','2421152','2421413','2423975')
            """,

        # handle u.Topic='' (1326526 rows)
        just_psych=f"and t.topic_descr regexp '{psych_topics}'",

        # find_problems
        just_ids="select distinct u.ID",
        where_id="and u.ID=:id"
    )

    if FIND_PROBLEMS:
        # # Those MD5s: UnicodeDecodeError: 'charmap' codec can't decode byte 0x9d in position 636: character maps to <undefined>
        # TODO try instead create_engine(convert_unicode=True)

        with session('books') as sessb:
            ids = ' '.join([sql.just_ids, sql.body])
            ids = [x.ID for x in sessb.execute(ids).fetchall()]
            problem_ids = []
            for i, id in enumerate(tqdm(ids)):
                if i % 10000 == 0:
                    problems = len(problem_ids) / len(ids) * 100
                    logger.info(f"{problems}% problems")
                try:
                    row = ' '.join([sql.select, sql.body, sql.where_id])
                    sessb.execute(text(row), {'id': id})
                except:
                    problem_ids.append(id)
        problem_ids = ','.join([f"'{id}'" for id in problem_ids])
        logger.info(f"and u.ID not in ({problem_ids})")
        exit(0)

    sql_ = [sql.select, sql.body]
    if not ALL_BOOKS: sql_ += [sql.just_psych]
    sql_ = ' '.join(sql_)
    with session('books') as sessb:
        df = pd.read_sql(sql_, sessb.bind)
    df = df.drop_duplicates(['Title', 'Author'])

    logger.info(f"n_books before cleanup {df.shape[0]}")
    logger.info("Removing HTML")
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
    df['thumbs'] = 0

    logger.info(f"Saving books to DB")
    df.to_sql('books', sess.bind, index=False, chunksize=500, if_exists='append', method='multi')

    return df.set_index('id', drop=False)


path_ = f"/storage/libgen_{vars.ENVIRONMENT}.npy"

def load_books_vecs(df):
    if exists(path_):
        with open(path_, 'rb') as f:
            vecs = np.load(f)
            if df.shape[0] == vecs.shape[0]:
                return vecs
            # else books table has changed, recompute

    logger.info(f"Running BERT on {df.shape[0]} entries")
    texts = (df.title + '\n' + df.text).tolist()
    from app.nlp import nlp_
    vecs = nlp_.sentence_encode(texts)
    nlp_.clear()
    with open(path_, 'wb') as f:
        np.save(f, vecs)
    return vecs


def load_books(sess):
    df = load_books_df(sess)
    vecs = load_books_vecs(df)
    return vecs, df


def train_books_predictor(books, vecs_books, shelf_idx, fine_tune=True):
    logger.info("Training DNN")
    # linear+mse for smoother distances, what we have here? where sigmoid+xentropy for
    # harder decision boundaries, which we don't have?
    act, loss = 'linear', 'mse'
    # act, loss = 'sigmoid', 'binary_crossentropy'

    input = Input(shape=(vecs_books.shape[1],))
    m = Dense(400, activation='elu')(input)
    m = Dense(1, activation=act)(m)
    m = Model(input, m)
    m.compile(
        # metrics=['accuracy'],
        loss=loss,
        optimizer=Adam(learning_rate=.0001),
    )

    x = vecs_books
    y = books.dist
    es = EarlyStopping(monitor='val_loss', mode='min', patience=3, min_delta=.0001)
    m.fit(
        x, y,
        epochs=50,
        batch_size=128,
        shuffle=True,
        callbacks=[es],
        validation_split=.3,
    )
    if not fine_tune or shelf_idx.sum() < 3:
        return m

    # Train harder on shelved books
    # K.set_value(m.optimizer.learning_rate, 0.0001)  # alternatively https://stackoverflow.com/a/60420156/362790
    x2 = x[shelf_idx]
    y2 = books[shelf_idx].dist
    m.fit(
        x2, y2,
        epochs=1,  # too many epochs overfits (eg to CBT). Maybe adjust LR *down*, or other?
        batch_size=16,
        callbacks=[es],
        validation_split=.3  # might not have enough data?
    )
    return m


def predict_books(user_id, vecs_user, n_recs=30, centroids=False):
    with session() as sess:
        # TODO should I move this down further, to get more lines to test?
        fixt = fixtures.load_books(user_id)
        if fixt is not None: return fixt

        vecs_books, books = load_books(sess)
        sql = "select book_id as id, user_id, shelf from bookshelf where user_id=%(uid)s"
        shelf = pd.read_sql(sql, sess.bind, params={'uid': user_id}).set_index('id', drop=False)
    shelf_idx = books.id.isin(shelf.id)

    # normalize for cosine, and downstream DNN
    chain = Similars(vecs_user, vecs_books).normalize()
    vecs_user, vecs_books = chain.value()

    logger.info("Finding cosine similarities")
    if centroids:
        labels = chain.agglomorative().value()
        lhs = np.vstack([
            vecs_user[labels == l].mean(0)
            for l in range(labels.max())
        ])
        chain = Similars(lhs, vecs_user)

    # Take best cluster-score for every book
    dist = chain.cosine().value().min(axis=0)
    # 0f29e591: minmax_scale(dist). norm_out=True works better
    # then map back onto books, so they're back in order (pandas index-matching)
    books['dist'] = dist

    if shelf_idx.sum() > 0:
        like, dislike = dist.min() - dist.std(), dist.max() + dist.std()
        shelf_map = dict(like=like, already_read=like, recommend=like, dislike=dislike, remove=None, ai=None)
        shelf['dist'] = shelf.shelf.apply(lambda k: shelf_map[k])
        shelf.dist.fillna(books.dist, inplace=True)  # fill in "remove"
        books.loc[shelf.index, 'dist'] = shelf.dist  # indexes(id) match, so assigns correctly
        assert not books.dist.isna().any(), "Messed up merging shelf/books.dist by index"

    # e2eaea3f: save/load dnn
    dnn = train_books_predictor(books, vecs_books, shelf_idx)

    books['dist'] = dnn.predict(vecs_books)

    # dupes by title in libgen
    # r = books.sort_values('dist')\
    df = books[~shelf_idx].sort_values('dist')\
        .drop_duplicates('title', keep='first')\
        .iloc[:n_recs]
    fixtures.save_books(user_id, df)
    return df

def run_books(user_id):
    with session() as sess:
        user_id = str(user_id)
        uid = {'uid': user_id}

        # don't run if ran recently (notice the inverse if & comparator, simpler)
        if sess.execute(text(f"""
        select 1 from users 
        where id=:uid and last_books > {utcnow} - interval '10 minutes' 
        """), uid).fetchone():
            return
        sess.execute(text(f"""
        update users set last_books={utcnow} where id=:uid
        """), uid)
        sess.commit()

        entries = sess.execute(text("""
        select c.vectors from cache_entries c
        inner join entries e on e.id=c.entry_id and e.user_id=:uid
        order by e.created_at desc;
        """), uid).fetchall()
        profile = sess.execute(text("""
        select vectors from cache_users where user_id=:uid
        """), uid).fetchone()

        vecs = []
        if profile and profile.vectors:
            vecs += profile.vectors
        for e in entries:
            if e.vectors: vecs += e.vectors
        vecs = np.vstack(vecs).astype(np.float32)
        res = predict_books(user_id, vecs)

        sess.execute(text("""
        delete from bookshelf where user_id=:uid and shelf='ai'
        """), uid)
        sess.commit()
        res = res.rename(columns=dict(id='book_id', dist='score'))[['book_id', 'score']]
        res['user_id'] = user_id
        res['shelf'] = 'ai'
        res['created_at'] = res['updated_at'] = datetime.datetime.utcnow()
        res.to_sql('bookshelf', sess.bind, if_exists='append', index=False)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--uid")
    parser.add_argument("--jid")
    args = parser.parse_args()

    # TODO refactor this, copied from run.py
    jid = args.jid
    try:
        run_books(args.uid)
        with session() as sess:
            sess.execute(text(f"""
            update jobs set state='done' where id=:jid
            """), dict(jid=jid))
        logger.warning(f"Books {jid} done")
    except Exception as err:
        err = str(traceback.format_exc())
        logger.error(f"Books error {err}")
        res = {"error": err}
        with session() as sess:
            sess.execute(text(f"""
            update jobs set state='error', data_out=:data where id=:jid
            """), dict(data=jsonb(res), jid=jid))
3
