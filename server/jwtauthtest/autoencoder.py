import os, pickle, time, math, pdb
from box import Box
import numpy as np
import keras
import tensorflow as tf
from keras import backend as K
from keras import activations
from keras.layers import Layer, Input, Dense, Lambda
from keras.models import Model, load_model
from keras.callbacks import EarlyStopping
from keras.optimizers import Adam, SGD
from sklearn.model_selection import train_test_split
from sklearn import preprocessing as pp
from jwtauthtest.tied_autoencoder_keras import DenseLayerAutoencoder


class AutoEncoder():
    model_path = 'tmp/ae.tf'

    def __init__(self):
        K.clear_session()
        self.Model, self.encoder = self.model()

    def model(self):
        latent = 10
        inputs = Input(shape=(768,))
        x = DenseLayerAutoencoder(
            [500, 100, latent],
            enco_act='linear',
            activation='elu'
        )(inputs)
        ae = Model(inputs=inputs, outputs=x)
        ae.compile(metrics=['accuracy'], optimizer=Adam(learning_rate=.0005), loss='mse')
        # ae.summary()

        embedded = Lambda(lambda x: ae.layers[1].encode(x),
                          output_shape=(latent,), name='encode')(inputs)
        # embedded._uses_learning_phase = True  # Dropout ops use learning phase
        embedder = Model(inputs, embedded)
        # print(embedder.summary())

        return ae, embedder

    def encode(self, x):
        return self.encoder.predict(x)

    def fit(self, x):
        # x = pp.minmax_scale(x)
        x_train, x_test = train_test_split(x, shuffle=True)
        es = EarlyStopping(monitor='val_loss', mode='min', patience=3, min_delta=.0001)
        self.Model.fit(
            x_train, x_train,
            epochs=100,
            batch_size=256,
            shuffle=True,
            callbacks=[es],
            validation_data=(x_test, x_test)
        )
        # model.save() giving me trouble. just use pickle for now
        self.Model.save_weights(self.model_path)

    def load(self):
        self.Model.load_weights(self.model_path)

from sklearn.cluster import MiniBatchKMeans as KMeans
import joblib
from scipy.spatial.distance import cdist
from kneed import KneeLocator
from sklearn_extra.cluster import KMedoids


class Clusterer():
    clust_path = "tmp/clust.joblib"

    AE = False
    CLUST = 'kmedoid' # kmeans|kmedoid
    FIND_KNEE = True
    DEFAULT_NCLUST = 25

    def __init__(self):
        self.loaded = False

        self.ae = None
        self.clust = None
        self.pipeline = [self.AE, self.CLUST, self.FIND_KNEE]
        self.init_models()

    def init_models(self):
        e_ = os.path.exists

        models = {}
        if e_(self.clust_path):
            models = joblib.load(self.clust_path)
            if models['pipeline'] == self.pipeline:
                self.loaded = True
            else:
                models = {}  # start over

        # Uncomment when testing
        # self.loaded = False
        # models = {}

        self.ae = AutoEncoder()
        if self.AE and self.loaded:
            self.ae.load()

        self.clust = models.get('clust', None)  # initialized in fit()
        self.n_clusters = models.get('n_clusters', self.DEFAULT_NCLUST)

    def knee(self, x, search=True):
        # TODO hyper cache this
        log_ = lambda v: math.floor(1 + v * math.log10(x.shape[0]))
        guess = Box(
            min=1,
            max=50, # log_(10),
            good=log_(3)
        )
        if not search:
            return guess.good

        step = 1  # math.ceil(guess.max / 10)
        K = range(guess.min, guess.max, step)
        scores = []
        for k in K:
            m = KMedoids(n_clusters=k) if self.CLUST == 'kmedoid'\
                else KMeans(n_clusters=k)
            score = m.fit(x).inertia_
            scores.append(score)
            print(k, score)
        S = math.floor(math.log(x.shape[0])) # 1=default; 100entries->S=2, 8k->3
        kn = KneeLocator(list(K), scores, S=S, curve='convex', direction='decreasing')
        knee = kn.knee or guess.good
        print('knee', knee)
        return knee

    def fit(self, x, n_users=None):
        if self.AE:
            self.ae.fit(x)
            x = self.ae.encode(x)

        # in case a model's fit() can't handle too many; we wanna make sure users prioritized
        if self.CLUST == 'kmedoid':
            n_idxs = x.shape[0]
            while True:
                rand_books = np.arange(x.shape[0])[n_users:]
                np.random.shuffle(rand_books)
                try:
                    x_ = np.vstack([
                        x[:n_users],
                        x[rand_books][:n_idxs]
                    ])
                    KMedoids(n_clusters=self.DEFAULT_NCLUST).fit(x_)
                    print(n_idxs, 'worked for kmedoid')
                    break  # worked
                except:
                    print(n_idxs, 'did not work, reducing')
                    n_idxs = math.ceil(n_idxs/2)
            x = x_

        self.n_clusters = nc = self.knee(x, search=True) if self.FIND_KNEE else self.DEFAULT_NCLUST
        if self.CLUST == 'kmedoid':
            self.clust = KMedoids(n_clusters=nc, metric='cosine').fit(x)
        else:
            self.clust = KMeans(n_clusters=nc).fit(x)
        self.save()

    def encode(self, x):
        if self.AE:
            x = self.ae.encode(x)
        return x

    def _cluster_small(self, x):
        # new clusterer, not trained one
        knee = self.knee(x, search=False)
        return KMedoids(n_clusters=knee).fit_predict(x)

    def cluster(self, x):
        x = self.encode(x)

        # fit/predict the simple stuff for now
        if x.shape[0] < 500:
            return self._cluster_small(x)

        return self.clust.predict(x)

    def save(self):
        joblib.dump(dict(
            pipeline=self.pipeline,
            clust=self.clust,
            n_clusters=self.n_clusters
        ), self.clust_path)