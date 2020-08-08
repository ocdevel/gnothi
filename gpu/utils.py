import os, json, math
import torch
from sqlalchemy import create_engine
from sklearn.cluster import AgglomerativeClustering
from multiprocessing import cpu_count

THREADS = cpu_count()

def join_(paths):
    return os.path.join(os.path.dirname(__file__), *paths)
config_json = json.load(open(join_(['config.json'])))
engine = create_engine(
    config_json['DB'].replace('host.docker.internal', 'localhost'),
    pool_pre_ping=True,
    pool_recycle=300,
    # pool_timeout=2,
)

# if Plugin caching_sha2_password could not be loaded:
# ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'youpassword';
# https://stackoverflow.com/a/49935803/362790
book_engine = create_engine(config_json['DB_BOOKS'])

def cosine(x, y):
    x = torch.tensor(x)
    y = torch.tensor(y)
    x_norm = x / x.norm(dim=1)[:, None]
    y_norm = y / y.norm(dim=1)[:, None]
    dot = 1. - torch.mm(x_norm, y_norm.T)
    return dot.numpy()


def cluster(x):
    nc = math.floor(1+5*math.log10(x.shape[0]))
    dists = cosine(x, x)
    print('dists.min', dists.min(), 'dists.max', dists.max())
    agg = AgglomerativeClustering(n_clusters=nc, affinity='precomputed', linkage='average')
    labels = agg.fit_predict(dists)
    return labels