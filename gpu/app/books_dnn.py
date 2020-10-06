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
from box import Box
from common.utils import vars, is_test
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
split = int(n_books * .7)

class BooksDNN(object):
    def __init__(self, vecs_user, df):
        self.user = vecs_user
        self.df = df
        self.m = None
        self.es = EarlyStopping(monitor='val_loss', mode='min', patience=3, min_delta=.0001)

        self.mask = Box(
            book_train=np.array([i <= split for i in range(n_books)]),
            book_val=np.array([i > split for i in range(n_books)]),
            user_train=self.df.any_rated,
            user_val=self.df.user_rated
        )

    def shuffle_idx(self, arr):
        shuffle = np.arange(arr.shape[0])
        np.random.shuffle(shuffle)
        return shuffle

    def generator_cosine(self, batch, validation=False):
        mask = self.mask.book_val if validation else self.mask.book_train
        bb = books[mask]
        bb = bb[self.shuffle_idx(bb)]
        while bb.size:
            bb = bb[:batch]
            a = bb
            shuffle = self.shuffle_idx(a)
            b = a[shuffle]
            x = np.hstack([a, b])

            y = Similars(a,b).normalize().cosine(abs=True).value()
            y = y[np.arange(a.shape[0]),shuffle]
            # can't do min_max since over batches
            # y = minmax_scale(y)

            yield x, y

    def generator_adjustments(self, batch, validation=False):
        mask = self.mask.user_val if validation else self.mask.user_train
        df = self.df[mask]
        user = self.user
        for i in range(user.shape[0]):
            bb = books[mask]
            df_ = df
            while bb.size:
                bb = bb[:batch]
                a = np.repeat([user[i]], bb.shape[0], axis=0)
                b = bb
                x = np.hstack([a, b])

                y = Similars(a, b).normalize().cosine(abs=True).value().diagonal()
                # Push highly-rated books up, low-rated books down. Do that even stronger for user's own ratings.
                # Using negative-score because cosine DISTANCE (less is better)
                df_ = df_.iloc[:batch]
                y = y - (y.std() * df_.global_score / 2.) \
                    - (y.std() * df_.user_score * 2.)
                yield x, y.values

    def generator_predict(self, batch, i):
        bb = books
        while bb.size:
            bb = bb[:batch]
            a = np.repeat([self.user[i]], bb.shape[0], axis=0)
            b = bb
            yield np.hstack([a, b])

    def init_model(self):
        input = Input(shape=(dims * 2,))
        m = Dense(600, activation='tanh')(input)
        m = Dense(100, activation='tanh')(m)
        m = Dense(1, activation='linear')(m)
        m = Model(input, m)
        # http://zerospectrum.com/2019/06/02/mae-vs-mse-vs-rmse/
        # MAE because we _want_ outliers (user score adjustments)
        m.compile(
            # loss='mae',
            loss='mse',
            optimizer=Adam(learning_rate=.0003),
        )
        m.summary()
        self.m = m

    def learn_cosine_function(self):
        logger.info("DNN: learn cosine function")
        # https://www.machinecurve.com/index.php/2020/04/06/using-simple-generators-to-flow-data-from-file-with-keras/
        # https://www.tensorflow.org/api_docs/python/tf/keras/Model#fit
        batch = 128
        self.m.fit(
            self.generator_cosine(batch),
            # epochs=1,
            epochs=40,
            callbacks=[self.es],
            validation_data=self.generator_cosine(batch, validation=True),
            steps_per_epoch=int(self.mask.book_train.sum()/batch),
            validation_steps=int(self.mask.book_val.sum()/batch),
        )

    def learn_adjustments(self):
        if self.df.any_rated.sum() < 3: return
        logger.info("DNN: learn adjustments function")
        batch = 16
        self.m.fit(
            self.generator_adjustments(batch),
            epochs=20,  # too many epochs overfits (eg to CBT). Maybe adjust LR *down*, or other?
            # epochs=1,
            callbacks=[self.es],
            validation_data=self.generator_adjustments(batch, validation=True),
            steps_per_epoch=int(self.mask.user_train.sum()*self.user.shape[0]/batch),
            validation_steps=int(self.mask.user_val.sum()*self.user.shape[0]/batch)
        )

    def train(self):
        self.init_model()
        self.learn_cosine_function()
        self.learn_adjustments()

    def predict(self):
        batch = 10000
        best = None
        for i in [0]:  # range(self.user.shape[0]):
            preds = self.m.predict(
                self.generator_predict(batch, i),
                steps=int(n_books/batch),
                verbose=1
            ).squeeze()
            if best is None:
                best = preds
                continue
            best = np.vstack([best, preds]).min(axis=0)
        # error Length of values (290000) does not match length of index (297557)
        return best
