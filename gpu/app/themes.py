import pdb, os
from sklearn.feature_extraction.text import TfidfVectorizer
from common.database import session
import common.models as M
from common.utils import vars
from app.nlp import nlp_
from ml_tools import Similars
import pandas as pd
import numpy as np
import logging
from sqlalchemy import func
logger = logging.getLogger(__name__)


def top_terms(texts, k=8):
    # see https://stackoverflow.com/a/34236002/362790
    model = TfidfVectorizer()
    res = model.fit_transform(texts)

    # https://medium.com/@cristhianboujon/how-to-list-the-most-common-words-from-text-corpus-using-scikit-learn-dad4d0cab41d
    sum_words = res.sum(axis=0)
    tf = pd.DataFrame([
        (word, sum_words[0, idx])
        for word, idx in model.vocabulary_.items()
    ], columns=['term', 'freq'])
    # tf = tf[freq.apply(lambda x: pos(tf.freq, x) > 90)] # take top 10% (still max @ k)
    terms = tf.sort_values('freq', ascending=False).iloc[:k].term.tolist()

    print(terms)
    return terms


def themes(eids, algo='kmeans'):
    logger.info("Themes")
    with session() as sess:
        # use Model to decrypt fields
        E, CE = M.Entry, M.CacheEntry
        res = sess.query(CE) \
            .with_entities(CE.paras, CE.clean, CE.vectors) \
            .join(E, E.id == CE.entry_id) \
            .filter(E.id.in_(eids), func.array_length(CE.vectors,1)>0) \
            .order_by(E.created_at.desc()) \
            .all()
    # assert len(eids) == len(res)
    entries = pd.Series([e for r in res for e in r.paras])
    stripped = pd.Series([c for r in res for c in r.clean])
    vecs = np.vstack([r.vectors for r in res]).astype(np.float32)

    if False and os.path.exists(vars.AE_PATH):
        clusters = Similars(vecs).autoencode(filename=vars.AE_PATH).cluster(algo=algo).value()
    else:
        clusters = Similars(vecs).normalize().cluster(algo=algo).value()

    topics = []
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
        dists = Similars(center, vecs_).normalize().cosine(abs=True).value().squeeze()
        entries_ = entries_.iloc[dists.argsort()].tolist()[:5]

        terms = top_terms(stripped_.tolist())
        topics.append({
            'n_entries': n_entries,
            'terms': terms,
            'summary': entries_,  # add full thing, will batch-compute next
            'sentiment': None,
        })

    groups = [t['summary'] for t in topics]
    batch_summaries = nlp_.summarization(groups, min_length=50, max_length=300)
    for i, res in enumerate(batch_summaries):
        print(res)
        topics[i]['summary'] = res['summary']
        topics[i]['sentiment'] = res['sentiment']

    topics = {
        'terms': top_terms(stripped, 10),
        'themes': topics
    }

    return topics
