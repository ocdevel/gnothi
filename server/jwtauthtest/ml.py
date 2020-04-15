import re, math, pdb, os
from pprint import pprint
import pandas as pd
import numpy as np
from box import Box
from multiprocessing import cpu_count

THREADS = cpu_count()

cache = Box({
    'summarizer': None,
    'sentimenter': None,
    'qa': None
})


"""
Influencers
"""

from xgboost import XGBRegressor

def influencers(engine, user_id, specific_target=None):
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

    return targets, all_imps


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

        postags = ['NOUN', 'ADJ', 'VERB', 'ADV', 'X']
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
                tokens.append(t._.inflect(t.pos_))
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

from transformers import pipeline

def summarize(text, min_length=5, max_length=20):
    global cache
    if not cache.summarizer:
        cache['summarizer'] = pipeline("summarization")
    if len(text) <= min_length:
        return text
    s = cache.summarizer(text, min_length=min_length, max_length=max_length)
    return s[0]['summary_text']


def sentiment(text):
    global cache
    if not cache.sentimenter:
        cache['sentimenter'] = pipeline("sentiment-analysis")
    sentiments = cache.sentimenter(text)
    for s in sentiments:
        # numpy can't serialize
        s['score'] = float(s['score'])
    print(sentiments)
    return sentiments[0]['label']


def query(question, entries):
    global cache
    if not cache.qa:
        cache['qa'] = pipeline("question-answering")

    context = ' '.join([unmark(e) for e in entries])
    answer = cache.qa(question=question, context=context)

    # {'score': 0.622232091629833, 'start': 34, 'end': 96, 'answer': 'the task of extracting an answer from a text given a question.'}
    # {'score': 0.5115299158662765, 'start': 147, 'end': 161, 'answer': 'SQuAD dataset,'}
    # answer = '\n\n'.join([
    #     context[a['start']:a['end']] + a['answer']
    #     for a in answer
    # ])

    return answer['answer']


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
            # Those MD5s: UnicodeDecodeError: 'charmap' codec can't decode byte 0x9d in position 636: character maps to <undefined>
            sql = """
               select u.Title, u.Author, d.descr
               from updated u 
               join description d on d.md5=u.MD5
               where u.Topic=198 and u.Language='English'
                   and (length(d.descr) + length(u.Title)) > 200
                   and u.MD5 not in ('96b2d80d4c9ccdca9a2c828f784adcfd', 'f2d6bdc57b366f14b3ae4d664107f0a6')
               """
            books = pd.read_sql(sql, conn)

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

    rows = pd.DataFrame({
        'text': e_user + books.descr.tolist(),
        'title': ['' for _ in e_user] + books.Title.tolist(),
        'author': ['' for _ in e_user] + books.Author.tolist()
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
    recs = rows.sort_values(by='sim_prod').iloc[:30][['title', 'author', 'text']]
    return [x for x in recs.T.to_dict().values()]
