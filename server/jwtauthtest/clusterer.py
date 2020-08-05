import math, os
import numpy as np
from keras import backend as K
from keras.layers import Layer, Input, Dense, Lambda
from keras.layers.merge import concatenate
from keras.models import Model, load_model
from keras.callbacks import EarlyStopping
from keras.optimizers import Adam
from sklearn import preprocessing as pp
from sklearn_extra.cluster import KMedoids
from sklearn.cluster import KMeans
from sklearn.cluster import AgglomerativeClustering
from scipy.spatial.distance import cdist
from sklearn.metrics import pairwise_distances_chunked
from jwtauthtest.cleantext import Clean
from kneed import KneeLocator


class Clusterer():
    model_path = 'tmp/ae.tf'
    DEFAULT_NCLUST = 20

    def __init__(self,
        n_clusters=None,
        with_topics=False,
        input_dim=768,
        latent=20,
        # dot preserves topology; cosine preserves angle distances; None is raw AE. Based on your downstream clusterer
        preserve='dot',  # dot|cosine|None,
        clusterer='agglomorative'  # kmedoids|kmeans|agglomorative
    ):
        K.clear_session()
        self.n_clusters = n_clusters or self.DEFAULT_NCLUST
        self.with_topics = with_topics
        self.input_dim = input_dim
        self.latent = latent
        self.preserve = preserve
        self.clusterer = clusterer

        self.loaded = False
        self.init_model()
        if os.path.exists(self.model_path + '.index'):
            self.load()

    def init_model(self):
        x_input = Input(shape=(self.input_dim,), name='x_input')
        e1 = Dense(500, activation='elu')(x_input)
        e2 = Dense(150, activation='elu')(e1)
        # linear for no bounds on encoder (simplest)
        # tanh to force normalized, in case clusterer wants that. This makes most sense to me
        # elu just performs better, but no intuition
        e3 = Dense(self.latent, activation='tanh')(e2)
        e_last = e3

        if self.preserve:
            x_other_input = Input(shape=(self.input_dim,), name='x_other_input')
            merged = concatenate([e_last, x_other_input])
        else:
            merged = e_last
        d1 = Dense(150, activation='elu')(merged)
        d2 = Dense(500, activation='elu')(d1)
        d3 = Dense(self.input_dim, activation='linear', name='decoder_out')(d2)
        d_last = d3

        d_in = [x_input]
        d_out, e_out = [d_last], [e_last]
        if self.preserve:
            dist_out = Dense(1, activation='sigmoid', name='dist_out')(d_last)
            d_in.append(x_other_input)
            d_out.append(dist_out)
        if self.with_topics:
            topic_out = Dense(self.n_clusters, activation='softmax', name='topic_out')(e_last)
            d_out.append(topic_out)
            e_out.append(topic_out)
        decoder = Model(d_in, d_out)
        encoder = Model(x_input, e_out)

        loss, loss_weights = {'decoder_out': 'mse'}, {'decoder_out': 1.}
        if self.preserve:
            loss['dist_out'] = 'binary_crossentropy'
            loss_weights['dist_out'] = 1.
        if self.with_topics:
            loss['topic_out'] = 'categorical_crossentropy'
            loss_weights['topic_out'] = .4  # value of 2-3 common
        decoder.compile(
            # metrics=['accuracy'],
            loss=loss,
            loss_weights=loss_weights,
            optimizer=Adam(learning_rate=.0005),
        )
        decoder.summary()

        self.decoder, self.encoder = decoder, encoder

    def fit(self, x, texts=None):
        np.random.shuffle(x)  # shuffle all data first, since validation_split happens before shuffle

        shuffle = np.arange(x.shape[0])
        np.random.shuffle(shuffle)

        if self.preserve == 'dot':
            # dot product fast & intuitive, but too hard to optimize
            dists = np.array([ np.dot(x[i], x[shuffle[i]]) for i in range(x.shape[0]) ])
            dists = pp.minmax_scale(dists)
        if self.preserve == 'cosine':
            print("Calc distances")
            dists = []
            pdc = pairwise_distances_chunked(x, metric='cosine', working_memory=64)
            for i, chunk in enumerate(pdc):
                sz = chunk.shape[0]
                start, stop = i * sz, (i + 1) * sz
                dist = chunk[np.arange(sz), shuffle[start:stop]]
                dists.append(dist)
            # cosine values bw [-1 1], no loss function for that (well, mse..) Scale to [0 1] and use binary_xentropy
            dists = np.concatenate(dists)
            print(dists.min(), dists.max())
            dists = pp.minmax_scale(dists) # (dists + 1) / 2

        # https://wizardforcel.gitbooks.io/deep-learning-keras-tensorflow/content/8.2%20Multi-Modal%20Networks.html
        inputs = {'x_input': x}
        outputs = {'decoder_out': x}
        if self.preserve:
            inputs['x_other_input'] = x[shuffle]
            outputs['dist_out'] = dists
        if self.with_topics:
            topics = Clean.lda_topics(texts, default_n_topics=self.DEFAULT_NCLUST)
            outputs['topic_out'] = topics

        es = EarlyStopping(monitor='val_loss', mode='min', patience=3, min_delta=.0001)
        self.decoder.fit(
            inputs,
            outputs,
            epochs=100,
            batch_size=128,
            # journal entries + books, need them mixed up. [update] shuffled up to, since validation_split used
            # shuffle=True,
            callbacks=[es],
            validation_split=.3,
        )
        self.decoder.save_weights(self.model_path)

    def load(self):
        self.decoder.load_weights(self.model_path)
        self.loaded = True

    def cluster(self, x, knee=False, topics_as_clusters=False):
        klass, args = {
            'agglomorative': (AgglomerativeClustering, {}),
            'kmeans': (KMeans, {}),
            'kmedoids': (KMedoids, {'metric': 'cosine'})
        }[self.clusterer]

        x = self.encoder.predict(x)

        # TODO knee for agglom
        if knee and self.clusterer != 'agglomorative':
            step = 2
            K = range(1, 40, step)
            scores = []
            for k in K:
                m = klass(n_clusters=k, **args).fit(x)
                scores.append(m.inertia_)
            kn = KneeLocator(list(K), scores, S=.5, curve='convex', direction='decreasing')
            print(scores)
            print('knee', kn.knee)
            knee = kn.knee
        knee = knee or math.floor(1+3*math.log10(x.shape[0]))

        if self.with_topics:
            x, topics = x  # 2 outputs
        if self.with_topics and topics_as_clusters:
            labels = topics
        else:
            labels = klass(n_clusters=knee, **args).fit(x).labels_
        return x, labels