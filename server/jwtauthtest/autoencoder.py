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
from sklearn.preprocessing import minmax_scale

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
    model_path = 'tmp/ae.tf'

    def __init__(self):
        K.clear_session()
        self.Model, self.encoder = self.model()

    def model(self):
        # See https://github.com/maxfrenzel/CompressionVAE/blob/master/cvae/cvae.py
        # More complex boilerplate https://towardsdatascience.com/build-the-right-autoencoder-tune-and-optimize-using-pca-principles-part-ii-24b9cca69bd6
        input = Input(shape=(768,))
        d1 = Dense(500, activation='elu')
        d2 = Dense(40, activation='elu')

        enc1 = d1(input)
        enc2 = d2(enc1)

        dec1 = DenseTied(d2, activation='elu')(enc2)
        dec2 = DenseTied(d1, activation='linear')(dec1)

        ae = Model(input, dec2)
        encoder = Model(input, enc2)

        adam = Adam(learning_rate=.0005)  # 1e-3
        ae.compile(metrics=['accuracy'], optimizer=adam, loss='mse')
        # ae.summary()

        return ae, encoder

    def fit(self, x):
        # x = minmax_scale(x)
        x_train, x_test = train_test_split(x, shuffle=True)
        es = EarlyStopping(monitor='val_loss', mode='min', patience=4, min_delta=.0001)
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
from sklearn.mixture import GaussianMixture


class Clusterer():
    umap_path = "tmp/umap.joblib"
    gmm_path = "tmp/gmm.joblib"
    kmeans_path = "tmp/kmeans.joblib"

    AE = True
    UMAP = False
    GMM = True
    FIND_KNEE = False

    def __init__(self):
        self.loaded = False

        self.ae = None
        self.umap = None
        self.clust = None
        self.init_models()

    def init_models(self):
        load_ct = np.sum([self.AE, self.UMAP, True])  # clust either GMM|Kmeans, either needs loading

        e_ = os.path.exists
        self.ae = AutoEncoder()
        if self.AE and e_(AutoEncoder.model_path + ".index"):
            self.ae.load()
            load_ct -= 1

        if self.UMAP and e_(self.umap_path):
            self.umap = joblib.load(self.umap_path)
            load_ct -=1
        else:
            self.umap = umap.UMAP(
                n_components=5,
                n_neighbors=20,
                min_dist=0.
            )

        self.n_clusters = 27  # default without fitting/loading
        if self.GMM:
            if e_(self.gmm_path):
                self.clust = joblib.load(self.gmm_path)
                load_ct -=1
            else:
                self.clust = GaussianMixture(n_components=self.n_clusters)
        else:
            if e_(self.kmeans_path):
                self.clust = joblib.load(self.kmeans_path)
                self.n_clusters = self.clust.cluster_centers_.shape[0]
                load_ct -= 1
            else:
                self.clust = KMeans(n_clusters=self.n_clusters)
        self.loaded = load_ct == 0

    def knee(self, x):
        # TODO hyper cache this
        guess = Box(min=1, max=10, good=3)
        guess = Box({
            k: math.floor(1 + v * math.log10(x.shape[0]))
            for k, v in guess.items()
        })
        step = math.ceil(guess.max / 10)
        K = range(guess.min, guess.max, step)
        scores = []
        for k in K:
            if self.GMM:
                gmm = GaussianMixture(n_components=k).fit(x)
                score = gmm.bic(x)
                scores.append(score)
            else:
                # distortion score. https://github.com/arvkevi/kneed/blob/master/notebooks/decreasing_function_walkthrough.ipynb
                km = KMeans(n_clusters=k).fit(x)
                score = cdist(x, km.cluster_centers_, 'euclidean')
                score = sum(np.min(score, axis=1)) / x.shape[0]
                scores.append(score)
            print(k, score)
        S = math.floor(math.log(x.shape[0])) # 1=default; 100entries->S=2, 8k->3
        kn = KneeLocator(list(K), scores, S=S, curve='convex', direction='decreasing', interp_method='polynomial')
        knee = kn.knee or guess.good
        print('knee', knee)
        return knee

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
            del self.umap._rp_forest  # https://github.com/lmcinnes/umap/issues/273
            joblib.dump(self.umap, self.umap_path)

        if self.FIND_KNEE:
            self.n_clusters = self.knee(x)
        if self.GMM:
            self.clust = GaussianMixture(n_components=self.n_clusters).fit(x)
            joblib.dump(self.clust, self.gmm_path)
        else:
            self.clust = KMeans(n_clusters=self.n_clusters).fit(x)
            joblib.dump(self.clust, self.kmeans_path)

    def cluster(self, x):
        x = self.encode(x)
        if self.GMM:
            y_pred_prob = self.clust.predict_proba(x)
            return y_pred_prob.argmax(1)
        return self.clust.predict(x)