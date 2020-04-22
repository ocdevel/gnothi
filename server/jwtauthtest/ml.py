import re, math, pdb, os
from pprint import pprint
import pandas as pd
import numpy as np
from box import Box
from multiprocessing import cpu_count

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


    # predictions
    next_preds = {}
    for c in cols:
        # we keep target column. Yes, likely most predictive; but a rolling
        # trend is important info
        X = fes.ewm(span=5).mean()
        y = X[c]
        model = XGBRegressor()
        model.fit(X, y)
        preds = model.predict(X.iloc[-1:])
        next_preds[c] = float(preds[0])
        model.fit(X, y)

    # importances
    targets = {}
    all_imps = []
    for target in target_ids:
        if specific_target and specific_target != target:
            continue
        X = fes.drop(columns=[target])
        y = fes[target]
        model = XGBRegressor()
        # This part is important. Rather than say "what today predicts y" (not useful),
        # or even "what history predicts y" (would be time-series models, which don't have feature_importances_)
        # we can approximate it a rolling average of activity.
        # TODO not sure which window fn to use: rolling|expanding|ewm?
        # https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.rolling.html
        # http://people.duke.edu/~ccc14/bios-823-2018/S18A_Time_Series_Manipulation_Smoothing.html#Window-functions
        mult_day_avg = X.ewm(span=5).mean()
        model.fit(mult_day_avg, y)
        imps = [float(x) for x in model.feature_importances_]

        # FIXME
        # /xgboost/sklearn.py:695: RuntimeWarning: invalid value encountered in true_divide return all_features / all_features.sum()
        # I think this is due to target having no different value, in which case
        # just leave like this.
        imps = [0. if np.isnan(imp) else imp for imp in imps]

        # put target col back in
        imps.insert(cols.index(target), 0.0)
        dict_ = dict(zip(cols, imps))
        all_imps.append(dict_)
        targets[target] = dict_

    all_imps = dict(pd.DataFrame(all_imps).mean())

    return targets, all_imps, next_preds


"""
Themes
"""

# from gensim.utils import simple_preprocess
from gensim.parsing import preprocessing as pp
from gensim.corpora.dictionary import Dictionary
from gensim.models import LdaModel
from gensim.models.wrappers import LdaMallet
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


def entries_to_data(entries, propn=True):
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
    texts = [pp.preprocess_string(e, filters=filters) for e in entries]
    dictionary = Dictionary(texts)

    # Create a corpus from a list of texts
    corpus = [dictionary.doc2bow(text) for text in texts]

    return texts, corpus, dictionary


def run_lda(corpus, dictionary, n_topics=None, advanced=False):

    # figure this out later, just a quick idea
    if not n_topics:
        n_topics = math.ceil(len(corpus)/20)
        n_topics = max(min(15, n_topics), 5)

    # Train the model on the corpus
    if advanced:
        os.environ['MALLET_HOME'] = os.getcwd() + '/mallet-2.0.8'
        mallet_path = os.environ['MALLET_HOME'] + '/bin/mallet'  # update this path
        lda = LdaMallet(
            mallet_path,
            corpus=corpus,
            num_topics=n_topics,
            id2word=dictionary,
            workers=THREADS
        )
    else:
        lda = LdaModel(corpus, num_topics=n_topics)

    return lda


def themes(entries, advanced=False):
    entries = entries_to_paras(entries)
    _, corpus, dictionary = entries_to_data(entries)
    lda = run_lda(corpus, dictionary, advanced=advanced)
    topics = {}
    for idx, topic in lda.show_topics(formatted=False, num_words=10):
        terms = [
            w[0] if advanced else dictionary[int(w[0])]
            for w in topic
        ]
        sent = sentiment(' '.join(terms))
        topics[str(idx)] = {'terms': terms, 'sentiment': sent}

    return topics

"""
Summarize
Sentiment
"""

GPU_JOBS = True
from transformers import pipeline, AutoTokenizer, AutoModelWithLMHead
import psycopg2, time
from uuid import uuid4
from sqlalchemy import create_engine
engine = create_engine(
    'postgresql://postgres:mypassword@db/ml_journal',
    connect_args={'connect_timeout': 5}
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
from langdetect import detect
from langdetect import DetectorFactory
DetectorFactory.seed = 0
from sqlalchemy import create_engine
book_engine = create_engine('mysql://root:mypassword@mysqldb/libgen')

def jensen_shannon(query, matrix):
    """
    This function implements a Jensen-Shannon similarity
    between the input query (an LDA topic distribution for a document)
    and the entire corpus of topic distributions.
    It returns an array of length M where M is the number of documents in the corpus
    """
    # lets keep with the p,q notation above
    p = query[None, :].T  # take transpose
    q = matrix.T  # transpose matrix
    m = 0.5 * (p + q)
    return np.sqrt(0.5 * (entropy(p, m) + entropy(q, m)))


def resources(entries, logger=None):
    e_user = entries_to_paras(entries)

    path_ = 'tmp/libgen.pkl'
    if os.path.exists(path_):
        logger.info("Loading LDA")
        with open(path_, 'rb') as pkl:
            lda, corpus, dictionary, books = pickle.load(pkl)
    else:
        logger.info("Fetching books")

        with book_engine.connect() as conn:
            sql = """
            -- select u.ID, u.MD5
            select u.Title, 
                u.Author, 
                d.descr,
                t.topic_descr
            from updated u
                inner join description d on d.md5=u.MD5
                inner join topics t on u.Topic=t.topic_id
                    and t.lang='en'
                    and t.topic_descr regexp 'psychology|self-help|therapy'
            where u.Language = 'English'
                and title not regexp 'sams|teach yourself'  -- comes from self-help; most are tech, figure this out
                and (length(d.descr) + length(u.Title)) > 200
                and u.MD5 not in (
                    '96b2d80d4c9ccdca9a2c828f784adcfd',
                    'f2d6bdc57b366f14b3ae4d664107f0a6',
                    'b5acb277ad50a6585bc8b45e8c0bce4b',
                    '3099eb8029a990cf0f9506fe04af4e77',
                    '4a0178fdc4a9c46cf02fe59d79b19127',
                    '30b71108a8636e1128602fa5a183f68d',
                    '20e320bab753680cbfd7580c0cbd2709',
                    '3204c90e2b8168f082a93653cbe00b20',
                    '28f89c1cff1b1d696b6667d59d4c756d'
                )
            """

            # Those MD5s: UnicodeDecodeError: 'charmap' codec can't decode byte 0x9d in position 636: character maps to <undefined>
            # -- and d.descr not rlike '[^\x00-\x7F]'
            # for row in conn.execute(sql):
            #     sql = f"""
            #     select u.MD5, u.Title, u.Author, d.descr, t.topic_descr
            #     from updated u
            #         inner join description d on d.md5=u.MD5
            #         inner join topics t on u.Topic=t.topic_id
            #     where u.ID={row.ID}
            #     """
            #     try:
            #         x = conn.execute(sql).fetchone()
            #     except:
            #         logger.info(row.MD5)

            books = pd.read_sql(sql, conn)
            books = books.drop_duplicates(['Title', 'Author'])



        logger.info("Removing HTML")
        broken = '(\?\?\?|\#\#\#)'  # russian / other FIXME better way to handle
        books = books[~(books.Title + books.descr).str.contains(broken)]
        books['descr'] = books.descr.apply(lambda x: BeautifulSoup(x, "lxml").text)
        books['clean'] = books.Title + ' ' + books.descr
        books = books[books.clean.apply(lambda x: detect(x) == 'en')]
        e_books = books.clean.tolist()

        logger.info(f"Running LDA on {len(e_books)} entries")
        _, corpus, dictionary = entries_to_data(e_books, propn=False)
        lda = run_lda(corpus, dictionary, n_topics=20, advanced=True)
        with open(path_, 'wb') as pkl:
            pickle.dump([lda, corpus, dictionary, books], pkl)

    texts_user, _, _ = entries_to_data(e_user, propn=False)
    corpus = [dictionary.doc2bow(e) for e in texts_user] + corpus

    user_fillers = ['' for _ in e_user]
    rows = pd.DataFrame({
        'text': e_user + books.descr.tolist(),
        'title': user_fillers + books.Title.tolist(),
        'author': user_fillers + books.Author.tolist(),
        'topic': user_fillers + books.topic_descr.tolist()
    })

    logger.info("Finding similars")
    doc_topic_dist = np.array([
        [tup[1] for tup in lst]
        for lst in lda[corpus]
    ])

    product = {}
    for mine in range(len(entries)):
        sims = jensen_shannon(
            doc_topic_dist[mine],
            doc_topic_dist
        )
        product[str(mine)] = sims
    rows['sim_prod'] = pd.DataFrame(product).product(axis=1).values
    # remove already-reads (0 is equal-distance, and product of 0 is still 0)
    # rows = rows[rows.sim_prod > 0.].copy()
    rows = rows.iloc[len(e_user):].copy()

    # sort by similar, take k
    recs = rows.sort_values(by='sim_prod').iloc[:30][['title', 'author', 'text', 'topic']]
    return [x for x in recs.T.to_dict().values()]
