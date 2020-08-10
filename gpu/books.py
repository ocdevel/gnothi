import os, pdb
from tqdm import tqdm
from utils import engine, cosine, book_engine
from cleantext import Clean
from box import Box
import numpy as np
import pandas as pd
import pickle
from nlp import sentence_encode
from sqlalchemy import text


def load_books():
    path_ = 'tmp/libgen.pkl'
    if os.path.exists(path_):
        print("Loading cached book data")
        with open(path_, 'rb') as pkl:
            return pickle.load(pkl)

    print("Fetching books")
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
        just_psych = f"and t.topic_descr regexp '{psych_topics}'",

        # find_problems
        just_ids="select distinct u.ID",
        where_id="and u.ID=:id"
    )

    FIND_PROBLEMS = False
    ALL_BOOKS = False

    if FIND_PROBLEMS:
        # # Those MD5s: UnicodeDecodeError: 'charmap' codec can't decode byte 0x9d in position 636: character maps to <undefined>
        # TODO try instead create_engine(convert_unicode=True)

        ids = ' '.join([sql.just_ids, sql.body])
        ids = [x.ID for x in engine.execute(ids).fetchall()]
        problem_ids = []
        for i, id in enumerate(tqdm(ids)):
            if i%10000==0:
                print(len(problem_ids)/len(ids)*100, '% problems')
            try:
                row = ' '.join([sql.select, sql.body, sql.where_id])
                engine.execute(text(row), id=id)
            except:
                problem_ids.append(id)
        problem_ids = ','.join([f"'{id}'" for id in problem_ids])
        print(f"and u.ID not in ({problem_ids})")
        exit(0)

    sql_ = [sql.select, sql.body]
    if not ALL_BOOKS: sql_ += [sql.just_psych]
    sql_ = ' '.join(sql_)
    with book_engine.connect() as conn:
        books_ = pd.read_sql(sql_, conn)
    books_ = books_.drop_duplicates(['Title', 'Author'])

    print('n_books before cleanup', books_.shape[0])
    print("Removing HTML")
    broken = '(\?\?\?|\#\#\#)'  # russian / other FIXME better way to handle
    books_ = books_[~(books_.Title + books_.descr).str.contains(broken)]\
        .drop_duplicates(['Title', 'Author'])  # TODO reconsider

    # .apply(Clean.fix_punct)\
    books_['descr'] = books_.descr.apply(Clean.strip_html)\
        .apply(Clean.only_ascii)\
        .apply(Clean.urls)\
        .apply(Clean.multiple_whitespace)\
        .apply(Clean.unmark)

    books_['clean'] = books_.Title + '\n' + books_.descr
    # books_ = books_[books_.clean.apply(lambda x: detect(x) == 'en')]
    print('n_books after cleanup', books_.shape[0])
    e_books = books_.clean.tolist()

    print(f"Running BERT on {len(e_books)} entries")
    vecs_books = sentence_encode(e_books)
    with open(path_, 'wb') as pkl:
        pickle.dump([vecs_books, books_], pkl)
    return vecs_books, books_


def books(entries, n_recs=30):
    entries = Clean.entries_to_paras(entries)

    print("Loading books")
    vecs_books, books_ = load_books()
    vecs_user = sentence_encode(entries)

    send_attrs = ['title', 'author', 'text', 'topic']
    books_ = books_.rename(columns=dict(
        descr='text',
        Title='title',
        Author='author',
        topic_descr='topic'
    )).set_index('ID', drop=False)

    print("Finding similars")
    r = cosine(vecs_user, vecs_books)  # dists
    r = np.hstack(np.absolute(r))
    r = pd.DataFrame({
        'ID': books_.ID.tolist() * vecs_user.shape[0],
        'dist': r
    })
    r = r.sort_values(by='dist')\
        .drop_duplicates('ID', keep='first')\
        .iloc[:n_recs].ID

    r = books_.loc[r][send_attrs]\
        .drop_duplicates('title', keep='first')  # dupes in libgen
    r = [x for x in r.T.to_dict().values()]
    return r