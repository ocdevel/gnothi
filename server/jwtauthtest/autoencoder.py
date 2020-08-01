import os, pickle, time, math, pdb
from box import Box
import numpy as np
import keras
import tensorflow as tf
from keras import backend as K
from keras.layers import Layer, Input, Dense
from keras.models import Model, load_model
from keras.callbacks import EarlyStopping
from keras.optimizers import Adam, SGD
from sklearn.model_selection import train_test_split
from scipy.spatial.distance import cdist
from kneed import KneeLocator

# umap needs https://github.com/lmcinnes/umap/issues/416
import umap
import joblib


# https://mc.ai/a-beginners-guide-to-build-stacked-autoencoder-and-tying-weights-with-it/
class DenseTied(Layer):
    def __init__(self, dense, activation=None, **kwargs):
        self.dense = dense
        self.activation = keras.activations.get(activation)
        super().__init__(**kwargs)

    def build(self, batch_input_shape):
        self.biases = self.add_weight(name="bias", initializer="zeros", shape=[self.dense.input_shape[-1]])
        super().build(batch_input_shape)

    def call(self, inputs):
        z = tf.matmul(inputs, self.dense.weights[0], transpose_b=True)
        return self.activation(z + self.biases)


class AutoEncoder():
    model_path = 'tmp/custom_ae.tf'

    def __init__(self):
        K.clear_session()
        self.Model, self.encoder = self.model()

    def model(self):
        # See https://github.com/maxfrenzel/CompressionVAE/blob/master/cvae/cvae.py
        # More complex boilerplate https://towardsdatascience.com/build-the-right-autoencoder-tune-and-optimize-using-pca-principles-part-ii-24b9cca69bd6
        # it likes [512, 512] -> 64 (for 768->32)
        layers = [
            # (500, 'relu'),
            (500, 'relu'),
            (64, 'relu')  # linear
        ]
        denses = [Dense(l[0], activation=l[1]) for l in layers]
        encos, decos = [], []
        input = Input(shape=(768,))
        for i, d in enumerate(denses):
            prev = input if i == 0 else encos[-1]
            encos.append(d(prev))
        for i, d in enumerate(denses[::-1]):
            mirror = -(i+1)
            # act = 'linear' if i == len(layers)-1 else layers[mirror][1]
            act = layers[mirror][1]
            deco = encos[-1] if i == 0 else decos[-1]
            deco = DenseTied(d, activation=act)(deco)
            decos.append(deco)

        ae = Model(input, decos[-1])
        encoder = Model(input, encos[-1])

        adam = Adam(learning_rate=1e-3)
        ae.compile(metrics=['accuracy'], optimizer=adam, loss='mse')
        #ae.summary()
        return ae, encoder

    def fit(self, x):
        x_train, x_test = train_test_split(x, shuffle=True)
        es = EarlyStopping(monitor='val_loss', mode='min', patience=4, min_delta=.001)
        self.Model.fit(
            x_train, x_train,
            epochs=50,
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


class Clusterer():
    umap_path = "tmp/umap.joblib"
    kmeans_path = "tmp/kmeans.joblib"
    AE = True
    UMAP = False

    def __init__(self, load=True):
        self.loaded = False
        self.ae = None
        self.umap = None
        self.clust = None

        # just check if one exists (fixme?)
        if load and os.path.exists(AutoEncoder.model_path + ".index"):
            self.load()
        else:
            self.init_models()

    def init_models(self):
        if self.AE:
            self.ae = AutoEncoder()
        if self.UMAP:
            self.umap = umap.UMAP(
                n_components=32,
                n_neighbors=20
            )

    def load(self):
        if self.AE:
            self.ae = AutoEncoder()
            self.ae.load()
        if self.UMAP:
            self.umap = joblib.load(self.umap_path)
        self.clust = joblib.load(self.kmeans_path)
        self.n_clusters = self.clust.cluster_centers_.shape[0]
        self.loaded=True

    def _knee(self, x):
        # TODO hyper cache this
        # Code from https://github.com/arvkevi/kneed/blob/master/notebooks/decreasing_function_walkthrough.ipynb
        guess = Box(min=1, max=10, good=3)
        guess = Box({
            k: math.floor(1 + v * math.log10(x.shape[0]))
            for k, v in guess.items()
        })
        step = 2  # math.ceil(guess.max / 10)
        K = range(guess.min, 100, step)
        distortions = []
        for k in K:
            kmeanModel = KMeans(n_clusters=k).fit(x)
            distortion = cdist(x, kmeanModel.cluster_centers_, 'euclidean')
            distortion = sum(np.min(distortion, axis=1)) / x.shape[0]
            distortions.append(distortion)
            print(k, distortion)
        S = math.floor(math.log(x.shape[0])) # 1=default; 100entries->S=2, 8k->3
        kn = KneeLocator(list(K), distortions, S=S, curve='convex', direction='decreasing', interp_method='polynomial')
        return kn.knee or guess.good

    def encode(self, x):
        if self.AE:
            x = self.ae.encoder.predict(x)
        if self.UMAP:
            x = self.umap.transform(x)
        return x

    def fit(self, x):
        if self.AE:
            self.ae.fit(x)
            x = self.ae.encoder.predict(x)
        if self.UMAP:
            x = self.umap.fit_transform(x)
            # del self.umap._rp_trees  # https://github.com/lmcinnes/umap/issues/273
            joblib.dump(self.umap, self.umap_path)
        self.n_clusters = self._knee(x)
        print('n_clusters', self.n_clusters)
        self.clust = KMeans(n_clusters=self.n_clusters).fit(x)
        joblib.dump(self.clust, self.kmeans_path)

    def cluster(self, x):
        x = self.encode(x)
        return self.clust.predict(x)