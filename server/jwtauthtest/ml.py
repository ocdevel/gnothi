import re, math, pdb, os
from pprint import pprint
import pandas as pd
import numpy as np
from box import Box
from multiprocessing import cpu_count

THREADS = cpu_count()

cache = Box({
    'summarizer': None,
    'sentimenter': None
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


def lemmas(txt):
    if not txt: return txt

    postags = ['NOUN', 'ADJ', 'VERB'] +\
        ['ADV', 'PROPN', 'X']  # reonsider these later

    tokens = []
    doc = nlp(txt)
    for t in doc:
        if t.pos_ == 'NUM': tokens.append('number')
        elif t.is_stop: continue
        elif t.pos_ not in postags: continue
        else: tokens.append(t._.inflect(t.pos_))
    return " ".join(tokens)


def themes(entries, advanced=False):
    entries = [
        unmark(para)
        for entry in entries
        for para in re.split('\n{2,}', entry)
    ]

    filters = [
        lambda x: x.lower(),
        pp.strip_non_alphanum,
        pp.strip_punctuation,
        pp.strip_multiple_whitespaces,
        pp.strip_numeric,
        lambda x: pp.strip_short(x, 2),
        lemmas
    ]
    entries = [pp.preprocess_string(e, filters=filters) for e in entries]
    dictionary = Dictionary(entries)

    # Create a corpus from a list of texts
    common_corpus = [dictionary.doc2bow(text) for text in entries]

    # figure this out later, just a quick idea
    n_topics = math.ceil(len(entries)/10)
    n_topics = max(min(15, n_topics), 5)

    topics = {}

    # Train the model on the corpus
    if advanced:
        os.environ['MALLET_HOME'] = os.getcwd() + '/mallet-2.0.8'
        mallet_path = os.environ['MALLET_HOME'] + '/bin/mallet'  # update this path
        lda = LdaMallet(
            mallet_path,
            corpus=common_corpus,
            num_topics=n_topics,
            id2word=dictionary,
            workers=THREADS
        )
        for idx, topic in lda.show_topics(formatted=False, num_words=10):
            topics[str(idx)] = [w[0] for w in topic]
    else:
        lda = LdaModel(common_corpus, num_topics=n_topics)
        for idx, topic in lda.show_topics(formatted=False, num_words=10):
            topics[str(idx)] = [dictionary[int(w[0])] for w in topic]

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
