"""
Adapted from optuna/examples/xgboost_cv.py
See these links for what various people consider important hypers. I'm including as many from these sources
as possible, and spreading their value-ranges to include the ranges proposed in each source.

https://towardsdatascience.com/fine-tuning-xgboost-in-python-like-a-boss-b4543ed8b1e
https://www.analyticsvidhya.com/blog/2016/03/complete-guide-parameter-tuning-xgboost-with-codes-python/
https://github.com/optuna/optuna/blob/master/examples/xgboost_cv.py
"""
import optuna, pdb
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from collections import OrderedDict
from common.utils import is_test

class EarlyStoppingExceeded(Exception):
    pass


class MyXGB:
    n_trials = 50 if is_test() else 150
    version = 1
    too_small = 20
    early_stop_at = 10

    base_params = {
        "verbosity": 0,
        "objective": "reg:squarederror",
        "eval_metric": "mae",
    }

    # 4e0d1fce num_boost_round & early_stopping_rounds hyper-optimized.
    # I think they shouldn't be; num_boost_round can be anything high, and early-stopping-rounds
    # should be some smart small-ish number, which cuts num-boost early anyway
    base_args = {
        "early_stopping_rounds": 10,
        "num_boost_round": 1000
    }

    small_params = {
        "max_depth": 2,
        "gamma": 2,
        "eta": 0.8,
        "alpha": 0.5,
        "lambda": 0.5
    }

    def __init__(self, x, y, enqueue=[], beat_this=None):
        self.x = x
        self.y = y

        self.enqueue=enqueue
        self.best_params = self.small_params
        self.best_value = None
        self.early_stop_i = 0
        self.beat_this = beat_this


    @staticmethod
    def small_model(x, y):
        dtrain = xgb.DMatrix(x, label=y)
        return xgb.train(
            params={**MyXGB.base_params, **MyXGB.small_params},
            dtrain=dtrain,
            verbose_eval=False,
        )

    @staticmethod
    def feature_importances(bst):
        """
        :param bst: trained xgboost model
        """

        # copied from xgboost.sklearn, since we're not using sklearn api.
        # Consider switch to sklearn api. Prevented because xgb.cv() not available in that api
        score = bst.get_score(importance_type='gain')
        imps = [score.get(f, 0.) for f in bst.feature_names]
        imps = np.array(imps, dtype=np.float32)
        if imps.sum():
            imps = imps / imps.sum()

        cols = pd.Series(bst.feature_names)
        imps = np.array(imps)
        idx = np.argsort(imps)[::-1]
        return OrderedDict(zip(
            cols[idx], imps[idx].tolist()
        ))

    def early_stop(self, study, trial):
        # https://github.com/optuna/optuna/issues/1001#issuecomment-596478792
        if self.beat_this is None:
            # not working with previous best to compare against for early-stopping
            return
        if self.early_stop_i > self.early_stop_at:
            raise EarlyStoppingExceeded()
        good_enough = round(study.best_value, 3) <= round(self.beat_this, 3)
        if good_enough or self.early_stop_i > 0:
            self.early_stop_i += + 1

    # FYI: Objective functions can take additional arguments
    # (https://optuna.readthedocs.io/en/stable/faq.html#objective-func-additional-args).
    def objective(self, trial):
        x, y = self.x, self.y

        # can't have nulls in label. Assumes imputed properly before use here
        y = y.fillna(np.mean(y))

        # See https://www.kaggle.com/rafjaa/dealing-with-very-small-datasets#t2 for small dataset hypers

        param = {}
        # -- From Optuna --
        param["lambda"] = trial.suggest_float("lambda", 1e-8, 1.0)
        param["alpha"] = trial.suggest_float("alpha", 1e-8, 1.0)
        # eta/learning_rate ranges: [0.05, 0.31, 0.05] [0.01, 1.] [.01, .2] [1e-8, 1.0]
        param["eta"] = trial.suggest_float("eta", 1e-8, 1.0)
        # max_depth ranges: [5, 16] [2, 15] [1, 9]
        param["max_depth"] = trial.suggest_int("max_depth", 2, 10)
        # gamma ranges: [.01, 5] [0, 5] [1e-8, 1.]
        param["gamma"] = trial.suggest_float("gamma", 1e-8, 5.)
        param["grow_policy"] = trial.suggest_categorical("grow_policy", ["depthwise", "lossguide"])

        # -- From towardsdatascience --
        # min_child_weight ranges: [1, 8]
        param["min_child_weight"] = trial.suggest_int("min_child_weight", 1, 8)
        # colsample_bytree ranges: [.3, .8] [.3, 1.]
        param["colsample_bytree"] = trial.suggest_float("colsample_bytree", .3, 1., step=.1)
        # subsample ranges: [.8, 1.] [.7, 1.]
        param["subsample"] = trial.suggest_float("subsample", .7, 1.)

        dtrain = xgb.DMatrix(x, label=y)
        xgb_cv_results = xgb.cv(
            params={**self.base_params, **param},
            dtrain=dtrain,
            nfold=3,
            verbose_eval=False,
            **self.base_args
        )

        # 41d91fed: n_estimators from len(xgb_cv_results), save to csv

        best_score = next(
            (s for s in xgb_cv_results["test-mae-mean"].values[::-1]
            if s and not np.isnan(s)),
            None
        )

        # 4e0d1fce write & analyze xgb hypers (feature_importances_ on hypers themselves)

        return best_score

    def optimize(self):
        if self.x.shape[0] < self.too_small:
            return
        study = optuna.create_study()
        study.enqueue_trial(self.small_params)
        for e in self.enqueue:
            study.enqueue_trial(e)
        try:
            study.optimize(self.objective, n_trials=self.n_trials, n_jobs=-1, callbacks=[self.early_stop]) #, timeout=600)
        except EarlyStoppingExceeded: pass
        self.best_value, self.best_params = study.best_value, study.best_params

    def train(self, x, y):
        x_train, x_val, y_train, y_val = train_test_split(x, y, test_size=0.3)
        dtrain = xgb.DMatrix(x_train, label=y_train)
        dval = xgb.DMatrix(x_val, label=y_val)

        return xgb.train(
            params={**self.base_params, **self.best_params},
            dtrain=dtrain,
            evals=[(dval, 'eval')],
            verbose_eval=False,
            **self.base_args
        )
