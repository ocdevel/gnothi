import os, pdb, math
from os.path import exists
from tqdm import tqdm
from utils import engine, cosine, book_engine, cluster, tnormalize
from cleantext import Clean
from box import Box
import numpy as np
import pandas as pd
import pickle
from nlp import nlp_
from sqlalchemy import text
import feather
from sklearn import preprocessing as pp

from keras import backend as K
from keras.layers import Input, Dense
from keras.models import Model, load_model
from keras.callbacks import EarlyStopping
from keras.optimizers import Adam


paths = Box(df='tmp/libgen.df', vecs='tmp/libgen.npy')


def load_books_df():
    if exists(paths.df):
        return feather.read_dataframe(paths.df)

    print("Load books MySQL")
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

        ids = ' '.join([sql.just_ids, sql.body])
        ids = [x.ID for x in book_engine.execute(ids).fetchall()]
        problem_ids = []
        for i, id in enumerate(tqdm(ids)):
            if i % 10000 == 0:
                print(len(problem_ids) / len(ids) * 100, '% problems')
            try:
                row = ' '.join([sql.select, sql.body, sql.where_id])
                book_engine.execute(text(row), id=id)
            except:
                problem_ids.append(id)
        problem_ids = ','.join([f"'{id}'" for id in problem_ids])
        print(f"and u.ID not in ({problem_ids})")
        exit(0)

    sql_ = [sql.select, sql.body]
    if not ALL_BOOKS: sql_ += [sql.just_psych]
    sql_ = ' '.join(sql_)
    with book_engine.connect() as conn:
        df = pd.read_sql(sql_, conn)
    df = df.drop_duplicates(['Title', 'Author'])

    print('n_books before cleanup', df.shape[0])
    print("Removing HTML")
    broken = '(\?\?\?|\#\#\#)'  # russian / other FIXME better way to handle
    df = df[~(df.Title + df.descr).str.contains(broken)] \
        .drop_duplicates(['Title', 'Author'])  # TODO reconsider

    df['descr'] = df.descr.apply(Clean.strip_html) \
        .apply(Clean.fix_punct) \
        .apply(Clean.only_ascii) \
        .apply(Clean.multiple_whitespace) \
        .apply(Clean.unmark)

    # books = books[books.clean.apply(lambda x: detect(x) == 'en')]
    print('n_books after cleanup', df.shape[0])

    df.rename(columns=dict(
        ID='id',
        descr='text',
        Title='title',
        Author='author',
        topic_descr='topic'
    ), inplace=True)

    feather.write_dataframe(df, paths.df)
    return df


def load_books_vecs(df):
    if exists(paths.vecs):
        with open(paths.vecs, 'rb') as f:
            return np.load(f)

    print(f"Running BERT on {df.shape[0]} entries")
    texts = (df.title + '\n' + df.text).tolist()
    vecs = nlp_.sentence_encode(texts)
    with open(paths.vecs, 'wb') as f:
        np.save(f, vecs)
    return vecs


def load_books():
    df = load_books_df()
    vecs = load_books_vecs(df)
    return vecs, df


def train_books_predictor(books, vecs_books, shelf_idx, fine_tune=True):
    print("Training DNN")
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
        epochs=2,  # too many epochs overfits (eg to CBT). Maybe adjust LR *down*, or other?
        batch_size=32,
        callbacks=[es],
        validation_split=.3  # might not have enough data?
    )
    return m


def predict_books(user_id, entries, bust=False, n_recs=30, centroids=False):
    entries = Clean.entries_to_paras(entries)
    vecs_user = nlp_.sentence_encode(entries)

    vecs_books, books = load_books()
    books = books.set_index('id', drop=False)

    with engine.connect() as conn:
        sql = "select book_id as id, user_id, shelf from bookshelf where user_id=%(uid)s"
        shelf = pd.read_sql(sql, conn, params={'uid': user_id}).set_index('id', drop=False)
    shelf_idx = books.id.isin(shelf.id)

    user_path = f"tmp/{user_id}-books.h5"
    if exists(user_path) and not bust:
        dnn = load_model(user_path)
    else:
        # normalize for cosine, and downstream DNN
        vecs_user, vecs_books = tnormalize(vecs_user, vecs_books)

        print("Finding cosine similarities")
        lhs = vecs_user
        if centroids:
            labels = cluster(vecs_user, norm_in=False)
            lhs = np.vstack([
                vecs_user[labels == l].mean(0)
                for l in range(labels.max())
            ])

        # Take best cluster-score for every book
        dist = cosine(lhs, vecs_books, abs=True, norm_in=False, norm_out=False).min(axis=0)
        # 0f29e591: minmax_scale(dist). norm_out=True works better
        # then map back onto books, so they're back in order (pandas index-matching)
        books['dist'] = dist

        if shelf_idx.sum() > 0:
            like, dislike = dist.min() - dist.std(), dist.max() + dist.std()
            shelf_map = dict(like=like, already_read=like, recommend=like, dislike=dislike, remove=None)
            shelf['dist'] = shelf.shelf.apply(lambda k: shelf_map[k])
            shelf.dist.fillna(books.dist, inplace=True)  # fill in "remove"
            books.loc[shelf.index, 'dist'] = shelf.dist  # indexes(id) match, so assigns correctly
            assert not books.dist.isna().any(), "Messed up merging shelf/books.dist by index"
        dnn = train_books_predictor(books, vecs_books, shelf_idx)
        dnn.save(user_path)

    books['dist'] = dnn.predict(vecs_books)

    # dupes by title in libgen
    # r = books.sort_values('dist')\
    r = books[~shelf_idx].sort_values('dist')\
        .drop_duplicates('title', keep='first')\
        .iloc[:n_recs]
    r = [x for x in r.T.to_dict().values()]
    return r