from jwtauthtest.utils import vars, THREADS
from jwtauthtest.database import engine
from jwtauthtest.cleantext import Clean
from jwtauthtest.clusterer import Clusterer
from jwtauthtest.xgb_hyperopt import run_opt
import re, math, pdb, os
from pprint import pprint
import pandas as pd
import numpy as np
from box import Box
from scipy.spatial.distance import cdist
from tqdm import tqdm


"""
Influencers
"""

from xgboost import XGBRegressor

def influencers(user_id, specific_target=None, logger=None):
    with engine.connect() as conn:
        fes = pd.read_sql("""
        select  
            fe.created_at::date, -- index 
            fe.field_id, -- column
            fe.value -- value
        from field_entries fe
        inner join fields f on f.id=fe.field_id
        where fe.user_id=%(user_id)s
            -- exclude these to improve model perf
            -- TODO reconsider for past data
            and f.excluded_at is null
        order by fe.created_at asc
        """, conn, params={'user_id': user_id})
        # uuid as string
        fes['field_id'] = fes.field_id.apply(str)

        before_ct = fes.shape[0]
        fes = fes.drop_duplicates(['created_at', 'field_id'])
        if before_ct != fes.shape[0]:
            logger.info(f"{before_ct - fes.shape[0]} Duplicates")

        fs = pd.read_sql("""
        select id, target, default_value, default_value_value
        from fields
        where user_id=%(user_id)s
            and excluded_at is null
        """, conn, params={'user_id': user_id})
        fs['id'] = fs.id.apply(str)

    target_ids = fs[fs.target == True].id.values
    fs = {str(r.id): r for i, r in fs.iterrows()}

    # Easier pivot debugging
    # fields['field_id'] =  fields.field_id.apply(lambda x: x[0:4])
    fes = fes.pivot(index='created_at', columns='field_id', values='value')

    # fes = fes.resample('D')
    cols = fes.columns.tolist()

    # TODO resample on Days
    for fid in fes.columns:
        dv = fs[fid].default_value
        dvv = fs[fid].default_value_value
        if not dv: continue
        if dv == 'value':
            if not dvv: continue
            fes[fid] = fes[fid].fillna(dvv)
        elif dv == 'ffill':
            fes[fid] = fes[fid].fillna(method='ffill') \
                .fillna(method='bfill')
        elif dv == 'average':
            fes[fid] = fes[fid].fillna(fes[fid].mean())

    # This part is important. Rather than say "what today predicts y" (not useful),
    # or even "what history predicts y" (would be time-series models, which don't have feature_importances_)
    # we can approximate it a rolling average of activity.
    # TODO not sure which window fn to use: rolling|expanding|ewm?
    # https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.rolling.html
    # http://people.duke.edu/~ccc14/bios-823-2018/S18A_Time_Series_Manipulation_Smoothing.html#Window-functions
    span = 3
    fes = fes.rolling(span, min_periods=1).mean()

    # hyper-opt (TODO cache params)
    t = specific_target or target_ids[0]
    X_opt = fes.drop(columns=[t])
    y_opt = fes[t]
    hypers, _ = run_opt(X_opt, y_opt)
    print(hypers)
    hypers = {}

    # predictions
    next_preds = {}
    for c in cols:
        # we keep target column. Yes, likely most predictive; but a rolling
        # trend is important info
        X = fes
        y = X[c]
        model = XGBRegressor(**hypers)
        model.fit(X, y)
        preds = model.predict(X.iloc[-1:])
        next_preds[c] = float(preds[0])
        model.fit(X, y)

    # importances
    targets = {}
    all_imps = []
    for t in target_ids:
        if specific_target and specific_target != t:
            continue
        X = fes.drop(columns=[t])
        y = fes[t]
        model = XGBRegressor(**hypers)
        model.fit(X, y)
        imps = [float(x) for x in model.feature_importances_]

        # FIXME
        # /xgboost/sklearn.py:695: RuntimeWarning: invalid value encountered in true_divide return all_features / all_features.sum()
        # I think this is due to target having no different value, in which case
        # just leave like this.
        imps = [0. if np.isnan(imp) else imp for imp in imps]

        # put target col back in
        imps.insert(cols.index(t), 0.0)
        dict_ = dict(zip(cols, imps))
        all_imps.append(dict_)
        targets[t] = dict_

    all_imps = dict(pd.DataFrame(all_imps).mean())

    return targets, all_imps, next_preds


"""
Themes
"""

from sklearn.feature_extraction.text import TfidfVectorizer

def themes(entries):
    entries = Clean.entries_to_paras(entries)
    vecs = run_gpu_model(dict(method='sentence-encode', args=[entries], kwargs={}))

    clusterer = Clusterer()
    assert(clusterer.loaded)
    _, clusters = clusterer.cluster(vecs)

    stripped = [' '.join(e) for e in Clean.lda_texts(entries, propn=True)]
    stripped = pd.Series(stripped)
    entries = pd.Series(entries)

    # see https://stackoverflow.com/a/34236002/362790
    top_terms = 8
    topics = {}
    for l in range(clusters.max()):
        in_clust = clusters == l
        n_entries = in_clust.sum().item()
        print('n_entries', n_entries)
        if n_entries < 2:
            print('skipping')
            continue

        vecs_, stripped_, entries_ = vecs[in_clust],\
            stripped.iloc[in_clust], entries.iloc[in_clust]

        center = vecs_.mean(axis=0)[np.newaxis,:]
        dists = cdist(center, vecs_, metric='cosine').squeeze()
        entries_ = entries_.iloc[dists.argsort()].tolist()[:5]
        entries_ = '\n'.join(entries_)  # todo smarter sentence-joiner?

        # model = CountVectorizer()
        model = TfidfVectorizer()
        res = model.fit_transform(stripped_.tolist())

        # https://medium.com/@cristhianboujon/how-to-list-the-most-common-words-from-text-corpus-using-scikit-learn-dad4d0cab41d
        sum_words = res.sum(axis=0)
        words_freq = [(word, sum_words[0, idx]) for word, idx in model.vocabulary_.items()]
        words_freq = sorted(words_freq, key=lambda x: x[1], reverse=True)
        terms = [x[0] for x in words_freq[:top_terms]]

        print(terms)
        summary = summarize(entries_, min_length=50, max_length=300)
        sent = sentiment(summary)
        # summary = sent = None
        l = str(l)
        topics[l] = {
            'n_entries': n_entries,
            'terms': terms,
            'sentiment': sent,
            'summary': summary
        }
        print('\n\n')
    return topics

"""
Summarize
Sentiment
"""

import psycopg2, time
from uuid import uuid4
OFFLINE_MSG = "AI server offline, check back later"


def run_gpu_model(data):
    # AI offline (it's spinning up from views.py->ec2_updown.py)
    res = engine.execute("select status from jobs_status limit 1").fetchone()
    if res.status != 'on':
        return False

    sql = f"insert into jobs values (%s, %s, %s)"
    jid = str(uuid4())
    engine.execute(sql, (jid, 'new', psycopg2.Binary(pickle.dumps(data))))
    i = 0
    while True:
        time.sleep(1)
        res = engine.execute("select state from jobs where id=%s", (jid,))
        state = res.fetchone().state

        # 5 seconds, still not picked up; something's wrong
        if i > 4 and state in ['new', 'error']:
            return False

        if state == 'done':
            job = engine.execute(f"select data from jobs where id=%s", (jid,)).fetchone()
            engine.execute("delete from jobs where id=%s", (jid,))
            res = pickle.loads(job.data)['data']
            if data['method'] == 'sentence-encode':
                res = np.array(res)
            return res
        i += 1


def summarize(text, min_length=None, max_length=None):
    args = [text]
    kwargs = {}
    if min_length: kwargs['min_length'] = min_length
    if max_length: kwargs['max_length'] = max_length
    res = run_gpu_model(dict(method='summarization', args=args, kwargs=kwargs))
    if res is False:
        return OFFLINE_MSG
    return res[0]['summary_text']


def sentiment(text):
    res = run_gpu_model(dict(method='sentiment-analysis', args=[text], kwargs={}))
    if res is False:
        return "surprise"
    return res[0]['label']


def query(question, entries):
    context = ' '.join([Clean.unmark(e) for e in entries])
    kwargs = dict(question=question, context=context)
    res = run_gpu_model(dict(method='question-answering', args=[], kwargs=kwargs))
    if res is False:
        return [{'answer': OFFLINE_MSG}]
    return res


"""
Resources
"""

from scipy.stats import entropy
import pickle
import scipy
from langdetect import detect
from langdetect import DetectorFactory
DetectorFactory.seed = 0
from sqlalchemy import create_engine, text

# if Plugin caching_sha2_password could not be loaded:
# ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'youpassword';
# https://stackoverflow.com/a/49935803/362790
book_engine = create_engine(vars.DB_BOOKS)

def load_books(logger):
    path_ = 'tmp/libgen.pkl'
    if os.path.exists(path_):
        logger.info("Loading cached book data")
        with open(path_, 'rb') as pkl:
            return pickle.load(pkl)

    logger.info("Fetching books")
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
        books = pd.read_sql(sql_, conn)
    books = books.drop_duplicates(['Title', 'Author'])

    print('n_books before cleanup', books.shape[0])
    logger.info("Removing HTML")
    broken = '(\?\?\?|\#\#\#)'  # russian / other FIXME better way to handle
    books = books[~(books.Title + books.descr).str.contains(broken)]

    books['descr'] = books.descr.apply(Clean.strip_html)\
        .apply(Clean.fix_punct)\
        .apply(Clean.only_ascii)\
        .apply(Clean.urls)\
        .apply(Clean.multiple_whitespace)\
        .apply(Clean.unmark)

    books['clean'] = books.Title + ' ' + books.descr
    # books = books[books.clean.apply(lambda x: detect(x) == 'en')]
    print('n_books after cleanup', books.shape[0])
    e_books = books.clean.tolist()

    logger.info(f"Running BERT on {len(e_books)} entries")
    if ALL_BOOKS:
        books_pkl = 'tmp/all_books.pkl'
        with open(books_pkl, 'wb') as f:
            pickle.dump(e_books, f)
        run_gpu_model(dict(method='sentence-encode-pkl', args=[books_pkl], kwargs={}))
        with open(books_pkl, 'rb') as f:
            vecs_books = pickle.load(f)
    else:
        vecs_books = run_gpu_model(dict(method='sentence-encode', args=[e_books], kwargs={}))
    with open(path_, 'wb') as pkl:
        pickle.dump([vecs_books, books], pkl)
    return vecs_books, books


def resources(entries, logger=None, n_recs=30):
    """
    metric=cosine is what's recommended in papers, but euclidean is used in our dim_reduce/cluster; and bert is normalized..
    by_cluster=True to prevent washing out opposite recommends
    by_centroid=False for a middle-ground between by_cluster=True|False (product within clusters, but not globally)
    """

    test = run_gpu_model(dict(method='sentence-encode', args=[["test test test"]], kwargs={}))
    offline_df = [{'ID': '', 'sims': 0, 'title': '', 'author': '', 'text': OFFLINE_MSG, 'topic': ''}]
    if test is False:
        return offline_df

    entries = Clean.entries_to_paras(entries)
    n_user = len(entries)

    print("Loading books")
    vecs_books, books = load_books(logger=logger)
    vecs_user = run_gpu_model(dict(method='sentence-encode', args=[entries], kwargs={}))

    clusterer = Clusterer()
    if not clusterer.loaded:
        print("Fitting clusterer")
        entries_all_users = engine.execute("select text from entries").fetchall()
        entries_all_users = Clean.entries_to_paras([x.text for x in entries_all_users])
        vecs_all_users = run_gpu_model(dict(method='sentence-encode', args=[entries_all_users], kwargs={}))
        x = np.vstack([vecs_all_users, vecs_books])
        texts = None
        if clusterer.with_topics:
            book_txts = (books.Title + ' ' + books.descr).tolist()
            texts = entries_all_users + book_txts
        clusterer.fit(x, texts=texts)
    enco_user, labels = clusterer.cluster(vecs_user)

    send_attrs = ['title', 'author', 'text', 'topic']
    books = books.rename(columns=dict(
        descr='text',
        Title='title',
        Author='author',
        topic_descr='topic'
    ))

    logger.info("Finding similars")
    recs = []

    for l in range(labels.max()):
        idx_user = labels == l
        if idx_user.sum() < 2: continue # not enough entries
        # Just use orig vecs for cosine. we encode/compress for things that need it (clustering, etc)
        books_ = books.copy()
        x_user, x_books = vecs_user[idx_user], vecs_books
        # x_user, x_books = enco_user[idx_user], enco_books

        center = x_user.mean(axis=0)[np.newaxis,:]
        metric = clusterer.preserve or 'dot'  # default to cosine?
        if metric == 'cosine':
            sims = cdist(center, x_books, "cosine").squeeze()
            sims = np.absolute(sims)
        else:
            sims = np.dot(center, x_books.T).squeeze()
            # TODO in my mind, dot should be as-is and cdist should be 1 - dist (for find-minimum); but it's opposite.
            sims = 1. - np.absolute(sims)
        books_['sims'] = sims

        # sort by similar, take k
        k = math.ceil(idx_user.sum() / n_user * n_recs)
        recs_ = books_.sort_values(by='sims').iloc[:k][['ID', 'sims', *send_attrs]]
        recs.append(recs_)

    recs = pd.concat(recs)
    recs = recs.drop_duplicates('ID').sort_values(by='sims')[send_attrs]
    recs = [x for x in recs.T.to_dict().values()]
    return recs