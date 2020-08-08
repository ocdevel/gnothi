from sklearn.feature_extraction.text import TfidfVectorizer
from nlp import sentence_encode, summarize, sentiment
from cleantext import Clean
from utils import cosine, cluster
import pandas as pd
import numpy as np
import threading

def themes(entries):
    entries = Clean.entries_to_paras(entries)
    vecs = sentence_encode(entries)

    clusters = cluster(vecs)

    stripped = [' '.join(e) for e in Clean.lda_texts(entries, propn=True)]
    stripped = pd.Series(stripped)
    entries = pd.Series(entries)

    # see https://stackoverflow.com/a/34236002/362790
    top_terms = 8
    topics = {}

    # for l in range(clusters.max()):
    def add_topic(l):
        nonlocal topics
        in_clust = clusters == l
        n_entries = in_clust.sum().item()
        print('n_entries', n_entries)
        if n_entries < 2:
            print('skipping')
            return

        vecs_, stripped_, entries_ = vecs[in_clust],\
            stripped.iloc[in_clust], entries.iloc[in_clust]

        center = vecs_.mean(axis=0)[np.newaxis,:]
        dists = cosine(center, vecs_).squeeze()
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
        summary = summarize(entries_, min_length=50, max_length=300)[0]["summary_text"]
        sent = sentiment(summary)[0]["label"]
        # summary = sent = None
        l = str(l)
        topics[l] = {
            'n_entries': n_entries,
            'terms': terms,
            'sentiment': sent,
            'summary': summary
        }

    threads = [
        threading.Thread(target=add_topic, args=(l,))
        for l in range(clusters.max())
    ]
    for t in threads: t.start()
    for t in threads: t.join()

    return topics