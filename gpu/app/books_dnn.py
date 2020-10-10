# https://github.com/tensorflow/tensorflow/issues/2117
import tensorflow as tf
config = tf.compat.v1.ConfigProto()
config.gpu_options.allow_growth = True
session = tf.compat.v1.Session(config=config)

from tensorflow.keras import backend as K
from tensorflow.keras.layers import Input, Dense, BatchNormalization
from tensorflow.keras.models import Model, load_model
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.utils import Sequence

import pdb, logging, math, re
from os.path import exists
from box import Box
from common.utils import vars, THREADS
from ml_tools import Similars
from sklearn.preprocessing import minmax_scale
import numpy as np
import pandas as pd
logger = logging.getLogger(__name__)

# TODO refactor with books.py
ALL_BOOKS = True
libgen_dir = "/storage/libgen"
libgen_file = f"{libgen_dir}/{vars.ENVIRONMENT}_{'all' if ALL_BOOKS else 'psych'}"  # '.ext
fname = f"{libgen_file}.tf"

books = np.load(f"{libgen_file}.npy", mmap_mode='r')
n_books, dims = books.shape[0], books.shape[1]
split = int(n_books * .7)

# TODO move to Sequence subclass
# https://stackoverflow.com/questions/55889923/how-to-handle-the-last-batch-using-keras-fit-generator

class BooksDNN(object):
    def __init__(self, vecs_user, df):
        self.hypers = Box({
            'l1': 600,
            'l2': {'n': 20},
            'act': 'tanh',
            'final': 'linear',
            'loss': 'mse',
            'batch': 300,
            'norm': True
        })
        if vecs_user.shape[0] > 5:
            vecs_user = Similars(vecs_user).cluster(algo='agglomorative').value()
        self.user = vecs_user
        self.df = df
        self.mask = Box(
            book_train=np.array([i <= split for i in range(n_books)]),
            book_val=np.array([i > split for i in range(n_books)]),
            user_train=self.df.any_rated,
            user_val=self.df.user_rated
        )
        self.m = None
        self.es = EarlyStopping(monitor='val_loss', mode='min', patience=3, min_delta=.0001)
        self.loaded = False
        self.init_model()

    def rand_idx(self, arr):
        shuffle = np.arange(arr.shape[0])
        np.random.shuffle(shuffle)
        return shuffle

    def generator_cosine(self, batch, validation=False):
        mask = self.mask.book_val if validation else self.mask.book_train
        books_ = books[mask]
        while True:
            idx = self.rand_idx(books_)[:batch]
            a = books_[idx]
            shuffle = self.rand_idx(a)
            b = a[shuffle]
            chain = Similars(a, b).normalize()
            if self.hypers.norm is True:
                a, b = chain.value()

            x = np.hstack([a, b])
            y = chain.cosine(abs=True).value()
            y = y.diagonal()

            yield x, y

    def generator_adjustments(self, batch, validation=False):
        mask = self.mask.user_val if validation else self.mask.user_train
        df = self.df[mask]
        books_ = books[mask]

        while True:
            idx = self.rand_idx(books_)[:batch]
            b = books_[idx]
            df_ = df.iloc[idx]

            # repeat user entries, cut off excess
            nbooks, nuser = b.shape[0], self.user.shape[0]
            a = np.tile(self.user, (math.ceil(nbooks/nuser), 1))[:nbooks]

            chain = Similars(a, b).normalize()
            if self.hypers.norm is True:
                a, b = chain.value()
            x = np.hstack([a, b])
            y = chain.cosine(abs=True).value().diagonal()
            # Push highly-rated books up, low-rated books down. Do that even stronger for user's own ratings.
            # Using negative-score because cosine DISTANCE (less is better)
            y = y - (y.std() * df_.global_score) \
                - (y.std() * df_.user_score * 2.)
            y = y.values
            yield x, y

    def generator_predict(self, batch, x):
        for i in range(0, books.shape[0], batch):
            bb = books[i:i+batch]
            a = np.repeat(x, bb.shape[0], axis=0)
            b = bb
            if self.hypers.norm is True:
                a, b = Similars(a, b).normalize().value()
            yield np.hstack([a, b])

    def init_model(self, load=True):
        if load and exists(fname):
            logger.info("DNN: pretrained model")
            self.m = load_model(fname)
            self.loaded = True
            return
        self.loaded = False

        h = self.hypers

        input = Input(shape=(dims * 2,))
        m = input
        if h.norm == 'bn':
            m = BatchNormalization()(m)
        m = Dense(int(h.l1), activation=h.act)(m)
        if h.l2.n:
            m = Dense(int(h.l2.n), activation=h.act)(m)
        m = Dense(1, activation=h.final)(m)
        m = Model(input, m)
        # http://zerospectrum.com/2019/06/02/mae-vs-mse-vs-rmse/
        # MAE because we _want_ outliers (user score adjustments)
        # loss = 'binary_crossentropy' if h.final == 'sigmoid' else h.loss
        loss = h.loss
        m.compile(
            loss=loss,
            optimizer=Adam(learning_rate=.0001),
        )
        m.summary()
        self.m = m

    def learn_cosine_function(self):
        if self.loaded:
            logger.info("DNN: using cosine-pretrained")
            return
        else:
            logger.info("DNN: learn cosine function")

        # https://www.machinecurve.com/index.php/2020/04/06/using-simple-generators-to-flow-data-from-file-with-keras/
        # https://www.tensorflow.org/api_docs/python/tf/keras/Model#fit
        batch = int(self.hypers.batch)
        self.m.fit(
            self.generator_cosine(batch),
            epochs=50,
            callbacks=[self.es],
            validation_data=self.generator_cosine(batch, validation=True),
            steps_per_epoch=math.ceil(self.mask.book_train.sum()/batch),
            validation_steps=math.ceil(self.mask.book_val.sum()/batch),
            # workers=THREADS,
            # use_multiprocessing=True
        )
        self.m.save(fname)

    def learn_adjustments(self):
        if self.df.any_rated.sum() < 3: return
        logger.info("DNN: learn adjustments function")
        batch = 16
        self.m.fit(
            self.generator_adjustments(batch),
            epochs=20,  # too many epochs overfits (eg to CBT). Maybe adjust LR *down*, or other?
            # callbacks=[self.es],
            validation_data=self.generator_adjustments(batch, validation=True),
            steps_per_epoch=math.ceil(self.mask.user_train.sum()/batch),
            validation_steps=math.ceil(self.mask.user_val.sum()/batch),
            # workers=THREADS,
            # use_multiprocessing=True
        )

    def train(self):
        self.learn_cosine_function()
        self.learn_adjustments()

    def predict(self):
        batch = 1000
        best = None
        for x in self.user:
            preds = self.m.predict(
                self.generator_predict(batch, [x]),
                steps=math.ceil(n_books/batch),
                verbose=1,
                # workers=THREADS,
                # use_multiprocessing=True
            ).squeeze()
            # preds = Similars([x], books).normalize().cosine(abs=True).value()
            if best is None:
                best = preds
                continue
            best = np.vstack([best, preds]).min(axis=0)
        return best


    def hyperopt(self, regex: str):
        table, max_evals = [], 100
        def objective(args):
            print(args)
            self.hypers = Box(args)
            self.init_model(load=False)
            self.train()
            preds = self.predict()
            df = self.df.copy()
            df['dist'] = preds
            df = df.sort_values('dist').iloc[:200]
            text = df.title + df.text
            score = sum([
                1 if re.search(regex, x, re.IGNORECASE) else 0
                for x in text
            ])
            args['score'] = score
            table.append(args)
            df = pd.DataFrame(table).sort_values('score', ascending=False)
            print(f"Top 5 ({df.shape[0]}/{max_evals})")
            print(df.iloc[:5])
            print("All")
            print(df)
            df.to_csv('./hypers.csv')
            return -score

        # define a search space
        from hyperopt import hp
        space = {
            'l1': hp.quniform('l1', 400, 900, 100),
            'l2': hp.choice('l2', [
                {'n': None},
                {'n': hp.quniform('n', 10, 400, 20)}
            ]),
            # no relu, since we may want negative values downstream
            'act': hp.choice('act', ['tanh', 'elu']),
            # no relu, since even though we constrain cosine positive, the adjustments may become negative
            'final': hp.choice('final', ['sigmoid', 'linear', 'elu']),
            'loss': hp.choice('loss', ['mse', 'mae']),
            'batch': hp.quniform('batch', 32, 512, 32),
            'norm': hp.choice('norm', [True, False, 'bn'])
        }

        # minimize the objective over the space
        from hyperopt import fmin, tpe, space_eval
        best = fmin(objective, space, algo=tpe.suggest, max_evals=max_evals, show_progressbar=False)

        print(best)
        # -> {'a': 1, 'c2': 0.01420615366247227}
        print(space_eval(space, best))
        # -> ('case 2', 0.01420615366247227}
