import os, pickle, time
from keras import backend as K
from keras.layers import Input, Dense
from keras.models import Model, load_model
from keras.callbacks import EarlyStopping
from keras.optimizers import Adam
from sklearn.model_selection import train_test_split

class AutoEncoder():
    def __init__(self, load=False):
        K.clear_session()
        self.load = load
        self.loaded = False

        self.autoencoder, self.encoder = self.model()
        self.model_path = 'tmp/encoder.tf'
        if self.load and os.path.exists(self.model_path + '.index'):
            self.autoencoder.load_weights(self.model_path)
            self.loaded = True

    def model(self):
        # See https://github.com/maxfrenzel/CompressionVAE/blob/master/cvae/cvae.py
        # it likes [512, 512] -> 64 (for 768->32)
        input = Input(shape=(768,))
        encoded = Dense(256, activation='relu')(input)
        encoded = Dense(32, activation='relu')(encoded)

        decoded = Dense(256, activation='relu')(encoded)
        decoded = Dense(768, activation=None)(decoded)

        autoencoder = Model(input, decoded)
        encoder = Model(input, encoded)

        adam = Adam(learning_rate=1e-3)
        autoencoder.compile(optimizer=adam, loss='mse')
        return autoencoder, encoder

    def fit(self, X):
        if self.loaded: return

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

    def fit_transform(self, X):
        self.fit(X)
        return self.encode(X)