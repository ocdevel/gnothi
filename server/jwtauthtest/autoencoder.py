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

from scipy.spatial.distance import cdist
from kneed import KneeLocator


class Clusterer():
    model_path = 'tmp/ae.tf'
    DEFAULT_NCLUST = 20

    def __init__(self, n_clusters=None):
        K.clear_session()
        self.n_clusters = n_clusters or self.DEFAULT_NCLUST
        self.init_model()
        self.loaded = False
        if os.path.exists(self.model_path + '.index'):
            self.load()

    def init_model(self):
        input_dim, latent = 768, 200

        x_input = Input(shape=(input_dim,), name='x_input')
        e1 = Dense(500, activation='elu')(x_input)
        e2 = Dense(latent, activation='linear')(e1)
        topic_out = Dense(self.n_clusters, activation='softmax', name='topic_out')(e2)

        x_other_input = Input(shape=(input_dim,), name='x_other_input')
        merged = concatenate([e2, x_other_input])
        d1 = Dense(500, activation='elu')(merged)
        d2 = Dense(input_dim, activation='linear', name='decoder_out')(d1)
        cdist_out = Dense(1, activation='tanh', name='cidst_out')(d2)

        decoder = Model(
            inputs=[x_input, x_other_input],
            outputs=[d2, cdist_out, topic_out]
        )
        encoder = Model(
            inputs=x_input,
            outputs=[e2, topic_out]
        )

        decoder.compile(
            # metrics=['accuracy'],
            loss={
                'decoder_out': 'mse',
                'topic_out': 'sparse_categorical_crossentropy',
                'cidst_out': 'mse'
            },
            # loss_weights={'decoder_out': 1., 'topic_out': 0.2},
            optimizer=Adam(learning_rate=.0005),
        )
        decoder.summary()

        self.decoder, self.encoder = decoder, encoder

    def cluster(self, x):
        x, topics = self.encoder.predict(x)
        return x, topics.argmax(axis=1)

    def fit(self, x, topics):
        # x_train, x_test = train_test_split(x, shuffle=True)
        x_train = x
        x_other = x.copy()
        np.random.shuffle(x_other)

        cdists = np.array([
            cdist([x_train[i]], [x_other[i]], "cosine")[0]
            for i in range(x.shape[0])
        ])

        # https://wizardforcel.gitbooks.io/deep-learning-keras-tensorflow/content/8.2%20Multi-Modal%20Networks.html
        # es = EarlyStopping(monitor='val_loss', mode='min', patience=3, min_delta=.0001)
        es = EarlyStopping(monitor='loss', mode='min', patience=3, min_delta=.0001)
        self.decoder.fit(
            {'x_input': x_train, 'x_other_input': x_other},
            {'decoder_out': x_train, 'topic_out': topics, 'cidst_out': cdists},
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