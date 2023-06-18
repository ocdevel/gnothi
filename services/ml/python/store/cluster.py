from common.util import fix_np
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans, AgglomerativeClustering
from sentence_transformers.util import semantic_search, pairwise_cos_sim
import math
from kneed import KneeLocator

def centroids(x, labels):
    return np.array([
        x[labels == l].mean(0).squeeze()
        for l in range(labels.max())
    ])

def cluster(embeddings, algo):
    n = embeddings.shape[0]

    # Number entries < 4 not enough to cluster from, return as-is
    if n < 5:
        return embeddings, np.ones(n).astype(int)

    # sims = pairwise_cos_sim(embeddings, embeddings)

    # Find optimal number of clusters (619091ec for silhouette approach), it's not working for me
    # (always gives nc=2). Wish it would work, since can use for agglomorative (metric=precomputed).
    # For now, just using kmeans to decide nc, then switching to model of choice
    if algo == 'agglomorative':
        # distance_threshold determines auto n_clusters, 1.5 was recommended
        # 1.5 gives me 40-nc, 2. gives me 13-nc
        # labels = AgglomerativeClustering(affinity='precomputed', linkage='average')
        labels = AgglomerativeClustering(n_clusters=None, distance_threshold=1.5) \
            .fit_predict(embeddings)
        nc = len(np.unique(labels))
        print(f"{algo}(n={n}) nc={nc}")
    else:
        kmeans_kwargs = dict(init="k-means++", random_state=42) #, n_init='auto')
        guess = dict(
            guess=math.floor(1 + 3 * math.log10(n)),
            max=min(math.ceil(n / 2), 50),  # math.floor(1 + 5 * math.log10(n))
            step=1  # math.ceil(guess.max / 10)
        )
        if algo == 'kmeans-knee':
            K = range(2, guess['max'], guess['step'])
            scores = [
                (KMeans(**kmeans_kwargs, n_clusters=k).fit(embeddings).inertia_)
                for k in K
            ]
            S = .25 # math.floor(math.log(all.shape[0]))  # 1=default; 100entries->S=2, 8k->3
            kn = KneeLocator(list(K), scores, S=S, curve='convex', direction='decreasing')
            nc = kn.knee or guess['guess']
        else:
            nc = guess['guess']
        print(f"{algo}(n={n}) nc={nc} guess={guess['guess']} max={guess['max']} step={guess['step']}")
        labels = KMeans(n_clusters=nc, **kmeans_kwargs).fit_predict(embeddings)

    # Label & return clustered centroids + labels
    return centroids(embeddings, labels), labels

def themes(embeddings, algo='kmeans-guess'):
    """
    :param texts:
    :param embeddings:
    :param algo: kmeans-guess | kmeans-knee | agglomorative
    :return:
    """
    # assert len(eids) == len(res)
    indexes = pd.Series(np.arange(len(embeddings)))
    centroids, labels = cluster(embeddings, algo)

    topics = []
    for l, center in enumerate(centroids):
        mask = labels == l
        n_entries = mask.sum().item()
        print('n_entries', n_entries)
        # if n_entries < 2:
        if n_entries < 1:
            print('skipping')
            continue
        topics.append(indexes[mask].tolist())

    return topics
