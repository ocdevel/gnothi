import os, pickle, time, math, pdb
from box import Box
import numpy as np
import keras
import tensorflow as tf
from keras import backend as K
from keras import activations
from keras.layers import Layer, Input, Dense, Lambda
from keras.layers.merge import concatenate
from keras.models import Model, load_model
from keras.callbacks import EarlyStopping
from keras.optimizers import Adam
from sklearn.model_selection import train_test_split
from sklearn import preprocessing as pp
from sklearn.cluster import MiniBatchKMeans as KMeans, DBSCAN
import umap
import hdbscan
from sklearn.mixture import GaussianMixture

from scipy.spatial.distance import cdist
from kneed import KneeLocator


class Clusterer():
    model_path = 'tmp/ae.tf'
    DEFAULT_NCLUST = 20
    LATENT = 20
    INPUT = 768

    def __init__(self, n_clusters=None):
        K.clear_session()
        self.n_clusters = n_clusters or self.DEFAULT_NCLUST
        self.init_model()
        self.loaded = False
        if os.path.exists(self.model_path + '.index'):
            self.load()

    def init_model(self):
        x_input = Input(shape=(self.INPUT,), name='x_input')
        e1 = Dense(500, activation='elu')(x_input)
        e2 = Dense(200, activation='elu')(e1)
        e3 = Dense(self.LATENT, activation='linear')(e2)
        label_out = Dense(self.n_clusters, activation='softmax', name='label_out')(e3)

        x_other_input = Input(shape=(self.INPUT,), name='x_other_input')
        merged = concatenate([e3, x_other_input])
        d1 = Dense(200, activation='elu')(merged)
        d2 = Dense(500, activation='elu')(d1)
        d3 = Dense(self.INPUT, activation='linear', name='decoder_out')(d2)
        dist_out = Dense(1, activation='tanh', name='dist_out')(d3)

        decoder = Model(
            inputs=[x_input, x_other_input],
            outputs=[d3, dist_out, label_out]
        )
        encoder = Model(
            inputs=x_input,
            outputs=[e3, label_out]
        )

        decoder.compile(
            # metrics=['accuracy'],
            loss={
                'decoder_out': 'mse',
                'label_out': 'sparse_categorical_crossentropy',
                'dist_out': 'mse'
            },
            # loss_weights={'decoder_out': 1., 'topic_out': 0.2},
            optimizer=Adam(learning_rate=.0005),
        )
        decoder.summary()

        self.decoder, self.encoder = decoder, encoder

    def fit(self, x):
        # FIXME x_train, x_test = train_test_split(x, shuffle=True)
        other_idx = np.arange(x.shape[0])
        np.random.shuffle(other_idx)

        metric = 'euclidean'
        print("UMAP")
        um = umap.UMAP(n_components=self.LATENT, min_dist=0., n_neighbors=20, metric=metric).fit(x)
        x_umap = um.transform(x)
        if metric == 'euclidean':
            print("GaussianMixture")
            labels = GaussianMixture(n_components=self.n_clusters, covariance_type='full').fit_predict(x_umap)
        else:
            print("DBSCAN")
            dbs = DBSCAN(metric='cosine', algorithm='brute').fit(x_umap)
            labels = dbs.labels_
            print("DBSCAN", np.unique(labels)) # TODO store n_clusters somewhere to use in init_models()

        # hdb = hdbscan.HDBSCAN(metric=metric).fit(x_umap)
        # print("HDBSCAN", np.unique(hdb.labels_))

        print("Computing Distances")
        def dist_(i):
            if metric == 'euclidean':
                return cdist([x_umap[i]], [x_umap[other_idx][i]], "euclidean")[0]
            return cdist([x[i]], [x[other_idx][i]], "cosine")[0]
        dists = np.array([dist_(i) for i in range(x.shape[0])])


        # https://wizardforcel.gitbooks.io/deep-learning-keras-tensorflow/content/8.2%20Multi-Modal%20Networks.html
        # es = EarlyStopping(monitor='val_loss', mode='min', patience=3, min_delta=.0001)
        es = EarlyStopping(monitor='loss', mode='min', patience=3, min_delta=.0001)
        self.decoder.fit(
            {'x_input': x, 'x_other_input': x[other_idx]},
            {'decoder_out': x, 'label_out': labels, 'dist_out': dists},
            # x_train, x_train,
            epochs=100,
            batch_size=256,
            shuffle=True,
            callbacks=[es],
            # validation_data=(x_test, x_test)  # fixme
        )
        # model.save() giving me trouble. just use pickle for now
        self.decoder.save_weights(self.model_path)

    def load(self):
        self.decoder.load_weights(self.model_path)
        self.loaded = True

    def cluster(self, x, ae_cluster=True):
        x, labels = self.encoder.predict(x)
        if ae_cluster:
            labels = labels.argmax(axis=1)
        else:
            # can use now, since AE was trained to preserve euclidean distance and x is dim-reduced
            nc = math.floor(1*3*math.log10(x.shape[0]))
            labels = KMeans(n_clusters=nc).fit_predict(x)
            # TODO try hdbscan
        return x, labels