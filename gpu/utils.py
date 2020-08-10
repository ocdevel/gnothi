import os, json, math, pdb
import torch
import numpy as np
from sqlalchemy import create_engine
from sklearn.cluster import AgglomerativeClustering
from multiprocessing import cpu_count
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
book_engine = create_engine(config_json['DB_BOOKS'], **engine_args)


def cosine(x, y, norm=False, abs=False):
    x = torch.tensor(x)
    y = torch.tensor(y)

    # x = x / x.norm(dim=1)[:, None]
    # y = y / y.norm(dim=1)[:, None]
    # normalize together first
    both = torch.cat((x, y), 0)
    both = both / both.norm(dim=1)[:, None]
    x, y = both[:x.shape[0]], both[x.shape[0]:]

    dist = 1. - torch.mm(x, y.T)
    if norm: dist = dist / dist.norm(dim=1)[:, None]
    if abs: dist = dist.abs()
    return dist.numpy()


def cluster(x):
    nc = math.floor(1 + 3.5 * math.log10(x.shape[0]))
    dists = cosine(x, x, norm=True, abs=True)
    agg = AgglomerativeClustering(n_clusters=nc, affinity='precomputed', linkage='average')
    labels = agg.fit_predict(dists)
    return labels
