from jwtauthtest.utils import vars
import re, math, pdb, os
from pprint import pprint
import pandas as pd
import numpy as np
from box import Box
from multiprocessing import cpu_count
from tqdm import tqdm

THREADS = cpu_count()

cache = Box({
    'summarization': None,
    'sentiment-analysis': None,
    'question-answering': None
})


"""
Influencers
"""

from xgboost import XGBRegressor

def influencers(engine, user_id, specific_target=None, logger=None):
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
    def roll(df_):
        span = 5
        return df_.rolling(span, min_periods=1).mean()

    # hyper-opt (TODO cache params)
    from jwtauthtest.xgb_hyperopt import run_opt
    t = specific_target or target_ids[0]
    X_opt = roll(fes.drop(columns=[t]))
    y_opt = fes[t]
    hypers, _ = run_opt(X_opt, y_opt)
    print(hypers)
    hypers = {}

    # predictions
    next_preds = {}
    for c in cols:
        # we keep target column. Yes, likely most predictive; but a rolling
        # trend is important info
        X = roll(fes)
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
        X = roll(fes.drop(columns=[t]))
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

# from gensim.utils import simple_preprocess
from gensim.parsing import preprocessing as pp
import spacy
import lemminflect
from jwtauthtest.unmarkdown import unmark
nlp = spacy.load('en_core_web_sm', disable=['parser', 'ner'])


def entries_to_paras(entries):
    return [
        unmark(para)
        for entry in entries
        for para in re.split('\n{2,}', entry)
    ]


def strip_text(entries, propn=True):
    def lemmas(txt):
        if not txt: return txt

        postags = ['NOUN', 'ADJ', 'VERB', 'ADV']
        if propn: postags.append('PROPN')

        tokens = []
        doc = nlp(txt)
        for t in doc:
            if t.pos_ == 'NUM':
                tokens.append('number')
            elif t.is_stop:
                continue
            elif t.pos_ not in postags:
                continue
            else:
                tokens.append(t._.lemma())
        return " ".join(tokens)

    filters = [
        lambda x: x.lower(),
        pp.strip_non_alphanum,
        pp.strip_punctuation,
        pp.strip_multiple_whitespaces,
        pp.strip_numeric,
        lambda x: pp.strip_short(x, 2),
        lemmas
    ]
    tokenized = [pp.preprocess_string(e, filters=filters) for e in entries]
    return [' '.join(e) for e in tokenized]


from sklearn.cluster import KMeans
from sklearn.manifold import TSNE
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
import hdbscan

def themes(entries):
    entries = entries_to_paras(entries)
    vecs = run_gpu_model(dict(method='sentence-encode', args=[entries], kwargs={}))
    # tsne = TSNE(init='random', random_state=10, perplexity=100, n_jobs=-1)
    tsne = TSNE()
    vecs = tsne.fit_transform(vecs)

    clusterer = hdbscan.HDBSCAN()
    clusterer.fit(vecs)
    labels = np.unique(clusterer.labels_)
    print('n_labels', len(labels))

    stripped = pd.Series(strip_text(entries))
    entries = pd.Series(entries)

    # see https://stackoverflow.com/a/34236002/362790
    top_terms = 8
    topics = {}
    for l in labels:
        if l == -1: continue  # assuming means no cluster?
        stripped_in_cluster = stripped.iloc[clusterer.labels_ == l].tolist()
        entries_in_cluster = entries.iloc[clusterer.labels_ == l].tolist()
        print('n_entries', len(entries_in_cluster))
        entries_in_cluster = '. '.join(entries_in_cluster)

        # model = CountVectorizer()
        model = TfidfVectorizer()
        res = model.fit_transform(stripped_in_cluster)

        # https://medium.com/@cristhianboujon/how-to-list-the-most-common-words-from-text-corpus-using-scikit-learn-dad4d0cab41d
        sum_words = res.sum(axis=0)
        words_freq = [(word, sum_words[0, idx]) for word, idx in model.vocabulary_.items()]
        words_freq = sorted(words_freq, key=lambda x: x[1], reverse=True)
        terms = [x[0] for x in words_freq[:top_terms]]

        print(terms)
        summary = summarize(entries_in_cluster, min_length=100, max_length=200)
        sent = sentiment(summary)
        topics[str(l)] = {'terms': terms, 'sentiment': sent, 'summary': summary}
        print('\n\n\n')
    return topics


"""
Summarize
Sentiment
"""

GPU_JOBS = True
from transformers import pipeline
import psycopg2, time
from uuid import uuid4
from sqlalchemy import create_engine
engine = create_engine(
    vars.DB_JOBS,
    pool_pre_ping=True,
    pool_recycle=300,
)


def run_cpu_model(data):
    global cache
    k = data['method']
    pipelines = ['summarization', 'sentiment-analysis', 'question-answering']
    if not cache[k] and k in pipelines:
        cache[k] = pipeline(k)
    start = time.time()
    res = cache[k](*data['args'], **data['kwargs'])
    print('Timing', time.time() - start)
    return res


def run_gpu_model(data):
    if not GPU_JOBS:
        return run_cpu_model(data)

    sql = f"insert into jobs values (%s, %s, %s)"
    jid = str(uuid4())
    engine.execute(sql, (jid, 'new', psycopg2.Binary(pickle.dumps(data))))
    i = 0
    while True:
        sql = f"select data from jobs where id=%s and state='done'"
        job = engine.execute(sql, (jid,)).fetchone()
        if job:
            engine.execute("delete from jobs where id=%s", (jid,))
            return pickle.loads(job.data)['data']

        # 4 seconds and it still hasn't picked it up? bail
        sql = f"select 1 from jobs where id=%s and state in ('new', 'error')"
        if i == 4 and engine.execute(sql, (jid,)).fetchone():
            break
        i += 1
        time.sleep(1)

    print("Job errored or timed out, using CPU")
    return run_cpu_model(data)


def summarize(text, min_length=5, max_length=20):
    if len(text) <= min_length:
        return text

    args = [text]
    kwargs = dict(min_length=min_length, max_length=max_length)
    res = run_gpu_model(dict(method='summarization', args=args, kwargs=kwargs))
    return res[0]['summary_text']


def sentiment(text):
    res = run_gpu_model(dict(method='sentiment-analysis', args=[text], kwargs={}))
    for s in res:
        # numpy can't serialize
        s['score'] = float(s['score'])
    return res[0]['label']


def query(question, entries):
    context = ' '.join([unmark(e) for e in entries])
    kwargs = dict(question=question, context=context)
    res = run_gpu_model(dict(method='question-answering', args=[], kwargs=kwargs))
    return res['answer']


"""
Resources
"""

from scipy.stats import entropy
from bs4 import BeautifulSoup
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


def resources(entries, logger=None):
    e_user = entries_to_paras(entries)

    path_ = 'tmp/libgen.pkl'
    if os.path.exists(path_):
        logger.info("Loading cached book data")
        with open(path_, 'rb') as pkl:
            vecs_books, books = pickle.load(pkl)
    else:
        logger.info("Fetching books")

        with book_engine.connect() as conn:
            sql = Box(
                select="select u.Title, u.Author, d.descr, t.topic_descr",
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
                just_psych = "and t.topic_descr regexp 'psychology|self-help|therapy|anthropology'",

                # find_problems
                just_ids="select distinct u.ID",
                where_id="and u.ID=:id"
            )

            FIND_PROBLEMS = False
            ALL_BOOKS = True

            if FIND_PROBLEMS:
                # # Those MD5s: UnicodeDecodeError: 'charmap' codec can't decode byte 0x9d in position 636: character maps to <undefined>
                ids = ' '.join([sql.just_ids, sql.body])
                ids = [x.ID for x in conn.execute(ids).fetchall()]
                problem_ids = []
                for i, id in enumerate(tqdm(ids)):
                    if i%10000==0:
                        print(len(problem_ids)/len(ids)*100, '% problems')
                    try:
                        row = ' '.join([sql.select, sql.body, sql.where_id])
                        conn.execute(text(row), id=id)
                    except:
                        problem_ids.append(id)
                problem_ids = ','.join([f"'{id}'" for id in problem_ids])
                print(f"and u.ID not in ({problem_ids})")
                exit(0)

            sql_ = [sql.select, sql.body]
            if not ALL_BOOKS: sql_ += [sql.just_psych]
            sql_ = ' '.join(sql_)
            books = pd.read_sql(sql_, conn)
            books = books.drop_duplicates(['Title', 'Author'])

        print('n_books before cleanup', books.shape[0])
        logger.info("Removing HTML")
        broken = '(\?\?\?|\#\#\#)'  # russian / other FIXME better way to handle
        books = books[~(books.Title + books.descr).str.contains(broken)]
        books['descr'] = books.descr.apply(lambda x: BeautifulSoup(x, "lxml").text)
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

    vecs_user = run_gpu_model(dict(method='sentence-encode', args=[e_user], kwargs={}))
    vecs = vecs_user + vecs_books

    user_fillers = ['' for _ in e_user]
    rows = pd.DataFrame({
        'text': e_user + books.descr.tolist(),
        'title': user_fillers + books.Title.tolist(),
        'author': user_fillers + books.Author.tolist(),
        'topic': user_fillers + books.topic_descr.tolist()
    })

    logger.info("Finding similars")

    product = {}
    for mine in range(len(entries)):
        sims = scipy.spatial.distance.cdist([ vecs[mine] ], vecs, "cosine")[0]
        product[str(mine)] = sims
    rows['sim_prod'] = pd.DataFrame(product).product(axis=1).values
    # remove already-reads (0 is equal-distance, and product of 0 is still 0)
    # rows = rows[rows.sim_prod > 0.].copy()
    rows = rows.iloc[len(e_user):].copy()

    # sort by similar, take k
    recs = rows.sort_values(by='sim_prod').iloc[:30][['title', 'author', 'text', 'topic']]
    return [x for x in recs.T.to_dict().values()]
