import os, json, math, pdb
import torch
import keras.backend as K
import numpy as np
from box import Box
from sqlalchemy import create_engine
from sklearn.cluster import AgglomerativeClustering
from multiprocessing import cpu_count
from sqlalchemy.orm import scoped_session, sessionmaker
from sklearn import preprocessing as pp

THREADS = cpu_count()

def join_(paths):
    return os.path.join(os.path.dirname(__file__), *paths)
config_json = json.load(open(join_(['config.json'])))

engine_args = dict(
    pool_pre_ping=True,
    pool_recycle=300,
    # pool_timeout=2,
)

engine = create_engine(
    config_json['DB'].replace('host.docker.internal', 'localhost'),
    **engine_args
)

# if Plugin caching_sha2_password could not be loaded:
# ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'youpassword';
# https://stackoverflow.com/a/49935803/362790
engine_books = create_engine(config_json['DB_BOOKS'], **engine_args)

SessLocal = Box(
    main=scoped_session(sessionmaker(autocommit=True, autoflush=True, bind=engine)),
    books=scoped_session(sessionmaker(autocommit=True, autoflush=True, bind=engine_books))
)


def shutdown_db():
    # FIXME not being called anywhere currently, need a "ctrl-c" hook or app on exit
    for _, sess in SessLocal.items():
        sess.remove()


def normalize(x, y=None, numpy=True):
    combine = y is not None
    x = x if torch.is_tensor(x) else torch.tensor(x)
    if combine:
        y = y if torch.is_tensor(y) else torch.tensor(y)
    n = torch.cat((x, y), 0) if combine else x
    n = n / n.norm(dim=1)[:, None]
    if combine:
        x, y = n[:x.shape[0]], n[x.shape[0]:]
        if numpy: x, y = x.numpy(), y.numpy()
        return x, y
    if numpy: n = n.numpy()
    return n


def cosine(x, y, norm_in=True):
    # TODO try https://github.com/facebookresearch/faiss
    # I need [0 1] for hierarchical clustering, and dists.sort_by(0->1), but cosine is [-1 1]
    x, y = torch.tensor(x), torch.tensor(y)
    if norm_in: x, y = normalize(x, y, numpy=False)
    sim = torch.mm(x, y.T)
    # print("sim.min=", sim.min(), "sim.max=", sim.max())

    # See https://stackoverflow.com/a/63532174/362790 for other options
    dist = (sim - 1).abs()
    # dist = sim.acos() / np.pi
    # dist = 1 - (sim + 1) / 2

    return dist.numpy()


def cluster(x, norm_in=True):
    nc = math.floor(1 + 3.5 * math.log10(x.shape[0]))
    if norm_in: x = normalize(x)
    dists = cosine(x, x, norm_in=False)
    agg = AgglomerativeClustering(n_clusters=nc, affinity='precomputed', linkage='average')
    labels = agg.fit_predict(dists)
    return labels


def clear_gpu():
    torch.cuda.empty_cache()
    K.clear_session()
