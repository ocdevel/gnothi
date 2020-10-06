# https://github.com/tensorflow/tensorflow/issues/2117
import tensorflow as tf
config = tf.compat.v1.ConfigProto()
config.gpu_options.allow_growth = True
session = tf.compat.v1.Session(config=config)

from tensorflow.keras import backend as K
from tensorflow.keras.layers import Input, Dense
from tensorflow.keras.models import Model, load_model
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.optimizers import Adam

import pdb, logging
from common.utils import vars
from ml_tools import Similars
from sklearn.preprocessing import minmax_scale
import numpy as np
logger = logging.getLogger(__name__)

# TODO refactor with books.py
ALL_BOOKS = True
libgen_dir = "/storage/libgen"
libgen_file = f"{libgen_dir}/{vars.ENVIRONMENT}_{'all' if ALL_BOOKS else 'psych'}"  # '.ext
fname = f"{libgen_file}.tf"

books = np.load(f"{libgen_file}.npy", mmap_mode='r')
n_books, dims = books.shape[0], books.shape[1]
split_ = int(n_books * .7)
batch = 250

class BooksDNN(object):
    def __init__(self, vecs_user, df):
        self.user = vecs_user
        self.df = df
        self.m = None

    def generator(self, user_i=None, fine_tune=False, validation=False):
        user = self.vecs_user
        user_range = range(user.shape[0]) if user_i is None else [user_i]

        mask = np.arange(n_books)
        mask = self.df.any_rated if fine_tune else mask
        mask = mask[:split_] if validation else mask[split_:]
        books_ = books[mask,:]
        df_ = self.df.iloc[mask]
        for i in user_range:
            for j in range(0, books_.shape[0], batch):
                book_batch = books_[j:j+batch]
                user_batch = np.repeat(user[i:i+1], book_batch.shape[0], axis=0)
                x = np.hstack([user_batch, book_batch])

                y = Similars(user_batch, book_batch).normalize().cosine(abs=True).value()
                y = y.min(axis=0)

                df_batch = df_.iloc[j:j+batch]
                # Push highly-rated books up, low-rated books down. Do that even stronger for user's own ratings.
                # Using negative-score because cosine DISTANCE (less is better)
                y = y - (y.std() * df_batch.global_score / 2.) \
                    - (y.std() * df_batch.user_score * 2.)
                y = minmax_scale(y)

                yield x, y

    def init_model(self):
        input = Input(shape=(dims * 2,))
        m = Dense(600, activation='relu')(input)
        m = Dense(100, activation='relu')(m)
        m = Dense(1, activation='sigmoid')(m)
        m = Model(input, m)
        # http://zerospectrum.com/2019/06/02/mae-vs-mse-vs-rmse/
        # MAE because we _want_ outliers (user score adjustments)
        m.compile(
            loss='mae',
            optimizer=Adam(learning_rate=.0003),
        )
        m.summary()
        self.m = m
        # self.es = EarlyStopping(monitor='val_loss', mode='min', patience=3, min_delta=.0001)
        self.es = EarlyStopping(monitor='val_loss', mode='min', patience=3, min_delta=.0001)

    def learn_cosine_function(self):
        logger.info("DNN: learn cosine function")
        # https://www.machinecurve.com/index.php/2020/04/06/using-simple-generators-to-flow-data-from-file-with-keras/
        self.m.fit(
            self.generator(),
            epochs=40,
            batch_size=128,
            shuffle=True,
            callbacks=[self.es],
            validation_data=self.generator(validation=True),
            # steps_per_epoch=books[:split_].shape[0] * self.user.shape[0],
            # do i need this? (since validation_data is finite)
            # validation_steps=int(books[:split_].shape[0]/batch),
        )

    def learn_adjustments(self):
        logger.info("DNN: learn adjustments function")
        self.model.fit(
            self.generator(fine_tune=True),
            epochs=20,  # too many epochs overfits (eg to CBT). Maybe adjust LR *down*, or other?
            batch_size=16,
            callbacks=[self.es],
            shuffle=True,
            validation_data=self.generator(fine_tune=True, validation=True),
            # validation_steps=int(books[split_:].shape[0]/batch)
        )

    def train(self):
        self.init_model()
        self.learn_cosine_function()
        self.learn_adjustments()

    def predict(self):
        return np.hstack([
            self.m.predict(self.generator(user_i=i))
            for i in self.user.shape[0]
        ]).min(axis=1)
