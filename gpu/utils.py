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


def tnormalize(x, y=None, numpy=True):
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


def cosine(x, y, abs='abs', norm_in=True, norm_out=True):
    x, y = torch.tensor(x), torch.tensor(y)
    if norm_in: x, y = tnormalize(x, y, numpy=False)
    sim = torch.mm(x, y.T)

    # TODO try https://github.com/facebookresearch/faiss
    # I need [0 1] for hierarchical clustering, and dists.sort_by(0->1), but cosine is [-1 1]
    if abs and sim.min() < 0.:
        # Don't do abs() if don't have to. Actually haven't seen it for a while... maybe due to norm_in?
        print("Running abs(), sim.min=", sim.min())
        if abs == 'acos':
            # https://math.stackexchange.com/a/3385463/816178
            if sim.min() <= -1. or sim.max() >= 1.:
                print("acos: cosine outside [-1 1]!", sim.min(), sim.max())
            max_ = 1. - 1e-10  # can't be -1 or 1 exactly
            sim = sim.clamp(-max_, max_).acos() / np.pi
        elif abs == 'minus1':
            # https://stackoverflow.com/a/54708258/362790
            sim = (sim - 1.).abs()
        else:  # abs == 'abs'
            # Just doing abs() doesn't preserve cosine properly in theory, but above solutions aren't working for me
            # abs() works best for me, investigate
            sim = sim.abs()
    if norm_out:
        # works much better than minmax_scale downstream
        sim = tnormalize(sim, numpy=False)

    dist = 1. - sim
    return dist.numpy()


def cluster(x):
    nc = math.floor(1 + 3.5 * math.log10(x.shape[0]))
    x = tnormalize(x)
    dists = cosine(x, x, norm_in=False, norm_out=True)
    agg = AgglomerativeClustering(n_clusters=nc, affinity='precomputed', linkage='average')
    labels = agg.fit_predict(dists)
    return labels
