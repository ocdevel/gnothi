import os, pickle, time
import keras
import tensorflow as tf
from keras import backend as K
from keras.layers import Layer, Input, Dense
from keras.models import Model, load_model
from keras.callbacks import EarlyStopping
from keras.optimizers import Adam, SGD
from sklearn.model_selection import train_test_split

import n2d


class Clusterer():
    ae_id = "tmp/n2d_ae.h5"
    encoder_id = "tmp/n2d_encoder"
    manifold_id = "tmp/n2d_manifold"

    def __init__(self, input_dim=768, latent_dim=32, n_clusters=20):
        self.n_clusters = n_clusters
        self.input_dim = input_dim
        self.latent_dim = latent_dim
        self.loaded = False
        if os.path.exists(self.ae_id):
            self.model = self.load_model()
            self.loaded = True
        else:
            self.model = self.init_model()

    def init_ae(self):
        return n2d.AutoEncoder(
            self.input_dim,
            self.latent_dim,
            architecture=[384]
        )

    def init_model(self):
        ae = self.init_ae()
        manifold_clusterer = n2d.UmapGMM(self.n_clusters)
        return n2d.n2d(ae, manifold_clusterer)

    def fit(self, X):
        self.model.fit(X, patience=3, epochs=15, weight_id=self.ae_id)
        n2d.save_n2d(self.model, 'tmp/n2d_encoder', 'tmp/n2d_manifold')

    def load_model(self):
        # n2d.load_n2d is broken: n2d(10,man)??
        ae = self.init_ae()
        ae.Model.load_weights(self.ae_id)
        man = pickle.load(open(self.manifold_id, "rb"))
        # encoder = load_model(self.encoder_id, compile=False)
        return n2d.n2d(ae, man)

    def encode(self, X):
        return self.model.encoder.predict(X)

    def cluster(self, X):
        return self.model.predict(X)