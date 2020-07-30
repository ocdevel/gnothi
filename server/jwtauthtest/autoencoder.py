import os, pickle, time
import keras
import tensorflow as tf
from keras import backend as K
from keras.layers import Layer, Input, Dense
from keras.models import Model, load_model
from keras.callbacks import EarlyStopping
from keras.optimizers import Adam, SGD
from sklearn.model_selection import train_test_split


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
    def __init__(self, load=False):
        K.clear_session()
        # load = False
        self.load = load
        self.loaded = False

        self.autoencoder, self.encoder = self.model()
        self.model_path = 'tmp/encoder.tf'
        if self.load and os.path.exists(self.model_path + '.index'):
            self.autoencoder.load_weights(self.model_path)
            self.loaded = True

    def model(self):
        # See https://github.com/maxfrenzel/CompressionVAE/blob/master/cvae/cvae.py
        # More complex boilerplate https://towardsdatascience.com/build-the-right-autoencoder-tune-and-optimize-using-pca-principles-part-ii-24b9cca69bd6
        # it likes [512, 512] -> 64 (for 768->32)
        layers = [
            (384, 'selu'),
            (64, 'linear')
        ]
        denses = [Dense(l[0], activation=l[1]) for l in layers]
        encos, decos = [], []
        input = Input(shape=(768,))
        for i, d in enumerate(denses):
            prev = input if i == 0 else encos[-1]
            encos.append(d(prev))
        for i, d in enumerate(denses[::-1]):
            mirror = -(i+1)
            act = layers[mirror][1]
            deco = encos[-1] if i == 0 else decos[-1]
            deco = DenseTied(d, activation=act)(deco)
            decos.append(deco)

        autoencoder = Model(input, decos[-1])
        encoder = Model(input, encos[-1])

        adam = Adam(learning_rate=1e-3)
        autoencoder.compile(metrics=['accuracy'], optimizer=adam, loss='mse')
        #autoencoder.summary()
        return autoencoder, encoder

    def fit(self, X):
        x_train, x_test = train_test_split(X, shuffle=True)
        es = EarlyStopping(monitor='val_loss', mode='min', patience=4, min_delta=.001)
        self.autoencoder.fit(
            x_train, x_train,
            epochs=50,
            batch_size=256,
            shuffle=True,
            callbacks=[es],
            validation_data=(x_test, x_test)
        )
        # model.save() giving me trouble. just use pickle for now
        self.autoencoder.save_weights(self.model_path)

    def encode(self, X):
        return self.encoder.predict(X)