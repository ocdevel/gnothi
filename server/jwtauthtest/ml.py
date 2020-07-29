from jwtauthtest.utils import vars
from jwtauthtest.database import engine
import re, math, pdb, os
from pprint import pprint
import pandas as pd
import numpy as np
from box import Box
from multiprocessing import cpu_count
from tqdm import tqdm

THREADS = cpu_count()


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
    from jwtauthtest.xgb_hyperopt import run_opt
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

import string
# from gensim.utils import simple_preprocess
from gensim.parsing import preprocessing as pp
from gensim.corpora.dictionary import Dictionary
#from gensim.models import LdaModel
from gensim.models.wrappers import LdaMallet
import spacy
import lemminflect
from jwtauthtest.unmarkdown import unmark
nlp = spacy.load('en_core_web_sm', disable=['parser', 'ner'])


class Clean():
    # TODO use RE_PUNCT inserts for proper punctuation handling. See gensim.parsing.preprocessing.RE_PUNCT
    # RE_PUNCT = re.compile(r'([%s])+' % re.escape(string.punctuation), re.UNICODE)
    RE_PUNCT = "[.,!;?]"

    @staticmethod
    def fix_punct(s):
        return re.sub(rf"({Clean.RE_PUNCT})([a-zA-Z])", r"\1 \2", s)

    @staticmethod
    def only_ascii(s):
        return re.sub(r"[^\x00-\x7F\xA9]+", "", s)

    @staticmethod
    def ends_w_punct(s):
        return re.search(rf"{Clean.RE_PUNCT}$", s)

    @staticmethod
    def is_markup_block(i, lines):
        s = lines[i]
        s_next = lines[i+1] if i+1 < len(lines) else ''
        RE_LI =  r"^\s*([*\-+]|[0-9]+\.)"
        is_block = False

        # heading
        if re.search(r"^[#]+", s):
            is_block = True
            end_with = "."
        # li (come before UL for inline replacement)
        elif re.search(RE_LI, s):
            s = re.sub("^\s*", "", s)  # unmark doesn't like spaces before li's
            is_block = True
            end_with = ";"
        # ul
        elif re.search(RE_LI, s_next):
            is_block = True
            end_with = ":"

        if not is_block: return False, ""
        s = unmark(s)
        s = s if Clean.ends_w_punct(s) else s + end_with
        return True, s

    @staticmethod
    def entries_to_paras(entries):
        # Convert entries into paragraphs. Do some basic cleanup
        paras = []
        def clean_append(p):
            p = unmark(p)

            if len(p) < 128: return
            p = Clean.fix_punct(p)
            p = Clean.only_ascii(p)
            p = pp.strip_multiple_whitespaces(p)
            if not Clean.ends_w_punct(p):
                p = p + "."
            paras.append(p)

        entries = "\n\n".join(entries)
        lines = re.split('\n+', entries)
        block_agg = []
        for i, line in enumerate(lines):
            # For consistent markdown blocks (title, list-header, list-items) group them all into one paragraph.
            # Once no more block detected, bust it.
            is_block, block_txt = Clean.is_markup_block(i, lines)
            if is_block:
                block_agg.append(block_txt)
                continue
            elif len(block_agg) > 0:
                block = " ".join(block_agg)
                block_agg.clear()
                clean_append(block)
            clean_append(line)
        return paras

    @staticmethod
    def lda_texts(entries, propn=True):
        def lemma(s):
            if not s: return s

            postags = ['NOUN', 'ADJ', 'VERB', 'ADV']
            # Should only be true for user viewing their account (eg, not for book-rec sor other features)
            if propn: postags.append('PROPN')

            tokens = []
            doc = nlp(s)
            for t in doc:
                if t.pos_ == 'NUM': tokens.append('number')
                elif t.is_stop or t.is_punct: continue
                elif t.pos_ not in postags: continue
                else: tokens.append(t._.lemma())
            return " ".join(tokens)

        # punctuation, numeric, stopwords handled in lemminflect
        filters = [
            lambda s: s.lower(),
            # _fix_punct, _only_ascii, # handled by strip_non_alphanum
            pp.strip_non_alphanum,
            pp.strip_multiple_whitespaces, # should be last, since pp.x() leaves whitespaces in removal
            lemma
        ]
        return [pp.preprocess_string(e, filters=filters) for e in entries]


def themes(entries, with_entries=True):
    paras = Clean.entries_to_paras(entries)
    texts = Clean.lda_texts(paras)
    dictionary = Dictionary(texts)
    corpus = [dictionary.doc2bow(text) for text in texts]

    # TODO run KneeLocator to find optimal coherence for n_topics, cache per user
    # https://www.desmos.com/calculator/ysj6inumvc
    # 1-5 entries should be about 1-3 topics; 200 entries about 8
    n_topics = math.floor(1 + 3 * math.log10(len(texts)))
    print('n_topics', n_topics, 'paras', len(texts))

    # Train the model on the corpus
    os.environ['MALLET_HOME'] = '/mallet-2.0.8'
    mallet_path = os.environ['MALLET_HOME'] + '/bin/mallet'  # update this path
    lda = LdaMallet(
        mallet_path,
        corpus=corpus,
        num_topics=n_topics,
        id2word=dictionary,
        workers=THREADS
    )

    for_summary = {i: [] for i in range(n_topics)}
    for i, a in enumerate(lda[corpus]):
        topic = np.argmax([x[1] for x in a])  # (topic, score)
        for_summary[topic].append(paras[i])

    topics = {}
    for i, topic in lda.show_topics(formatted=False, num_words=7):
        terms = [w[0] for w in topic]
        blob = (' ').join(for_summary[i])
        sent = sentiment(blob)
        summary = summarize(blob, min_length=64, max_length=128)
        topics[str(i)] = {'terms': terms, 'sentiment': sent, 'summary': summary}

    return topics

"""
Summarize
Sentiment
"""

import psycopg2, time
from uuid import uuid4
OFFLINE_MSG = "AI server offline, check back later"


def run_gpu_model(data):
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

    return False


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
    context = ' '.join([unmark(e) for e in entries])
    kwargs = dict(question=question, context=context)
    res = run_gpu_model(dict(method='question-answering', args=[], kwargs=kwargs))
    if res is False:
        return OFFLINE_MSG
    return res


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


def resources(entries, logger=None, metric="cosine", by_cluster=False, by_centroid=False, n_recs=40):
    test = run_gpu_model(dict(method='sentence-encode', args=[["test test test"]], kwargs={}))
    offline_df = [{'ID': '', 'sims': 0, 'title': '', 'author': '', 'text': OFFLINE_MSG, 'topic': ''}]
    if test is False:
        return offline_df

    e_user = Clean.entries_to_paras(entries)

    path_ = 'tmp/libgen.pkl'
    if os.path.exists(path_):
        logger.info("Loading cached book data")
        with open(path_, 'rb') as pkl:
            vecs_books, books = pickle.load(pkl)
    else:
        logger.info("Fetching books")

        with book_engine.connect() as conn:
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
        books['descr'] = books.descr.apply(lambda x: BeautifulSoup(x, "html5lib").text)
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

    user_fillers = ['' for _ in e_user]
    rows = pd.DataFrame({
        'ID': user_fillers + books.ID.tolist(),
        'text': e_user + books.descr.tolist(),
        'title': user_fillers + books.Title.tolist(),
        'author': user_fillers + books.Author.tolist(),
        'topic': user_fillers + books.topic_descr.tolist()
    })
    if by_cluster:
        themes_ = themes(entries)
    else:
        themes_ = {}
    if len(themes_) < 1:
        themes_ = {'0': {
            'entries': [True for _ in e_user],
            'n_entries': len(e_user)
        }}
    # since clustering may remove some entries, don't just use len(entries)
    n_entries = sum(t['n_entries'] for _, t in themes_.items())

    logger.info("Finding similars")
    send_attrs = ['title', 'author', 'text', 'topic']
    recs = []

    for _, theme in themes_.items():
        books_ = rows.iloc[len(e_user):].copy()
        entries_ = np.array(vecs_user)[theme['entries']]

        if by_centroid:
            # Similar by distance to centroid
            centroid = np.mean(entries_, axis=0)
            books_['sims'] = scipy.spatial.distance.cdist([centroid], vecs_books, metric)[0]
        else:
            # Similar by product
            sims = scipy.spatial.distance.cdist(entries_, vecs_books, metric)
            books_['sims'] = np.prod(sims, axis=0)

        # sort by similar, take k
        k = math.ceil(theme['n_entries'] / n_entries * n_recs)
        k = max([k, 4])
        recs_ = books_.sort_values(by='sims').iloc[:k][['ID', 'sims', *send_attrs]]
        recs.append(recs_)

    recs = pd.concat(recs)
    recs = recs.drop_duplicates('ID').sort_values(by='sims')[send_attrs]
    recs = [x for x in recs.T.to_dict().values()]
    return recs