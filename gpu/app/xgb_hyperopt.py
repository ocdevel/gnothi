"""
Adapted from optuna/examples/xgboost_cv.py
See these links for what various people consider important hypers. I'm including as many from these sources
as possible, and spreading their value-ranges to include the ranges proposed in each source.

https://towardsdatascience.com/fine-tuning-xgboost-in-python-like-a-boss-b4543ed8b1e
https://www.analyticsvidhya.com/blog/2016/03/complete-guide-parameter-tuning-xgboost-with-codes-python/
https://github.com/optuna/optuna/blob/master/examples/xgboost_cv.py
"""

import os
import shutil

import sklearn.datasets
import sklearn.metrics
import xgboost as xgb

import optuna

import pdb
import pandas as pd
import numpy as np
from common.database import engine
from catboost import Pool, CatBoostRegressor
from collections import OrderedDict

SEED = 108
N_FOLDS = 3
CV_RESULT_DIR = "./xgboost_cv_results"

def feature_importances(xgb_model, cols, target=None):
    """
    :param xgb_model: trained xgboost model
    :param x: the x DataFrame it was trained on, used to extract column names
    :param y: if provided, put y back into the returned results (eg for data consistency)
    :return:
    """
    imps = [float(v) for v in xgb_model.feature_importances_]

    # FIXME
    # /xgboost/sklearn.py:695: RuntimeWarning: invalid value encountered in true_divide return all_features / all_features.sum()
    # I think this is due to target having no different value, in which case
    # just leave like this.
    imps = [0. if np.isnan(imp) else imp for imp in imps]

    # put target col back in
    if target:
        imps.insert(cols.index(target), 0.0)
    imps = np.array(imps)
    idx = np.argsort(imps)
    return OrderedDict(zip(cols[idx], imps[idx]))

class XGBHyperOpt:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.results = []

    # FYI: Objective functions can take additional arguments
    # (https://optuna.readthedocs.io/en/stable/faq.html#objective-func-additional-args).
    def objective(self, trial):
        dtrain = xgb.DMatrix(self.x, label=self.y)

        param = {
            "verbosity": 0,
            "objective": "reg:squarederror",
            "eval_metric": "rmse",
            "booster": "gbtree",  # trial.suggest_categorical("booster", ["gbtree", "gblinear", "dart"]),
            # from optuna
            "lambda": trial.suggest_loguniform("lambda", 1e-8, 1.0),
            "alpha": trial.suggest_loguniform("alpha", 1e-8, 1.0),
            # "tree_method": "gpu_hist"
        }

        if param["booster"] == "gbtree" or param["booster"] == "dart":
            # -- From Optuna --
            # max_depth ranges: [5, 16] [2, 15] [1, 9]
            param["max_depth"] = trial.suggest_int("max_depth", 1, 15)
            # eta/learning_rate ranges: [0.05, 0.31, 0.05] [0.01, 1.] [.01, .2] [1e-8, 1.0]
            param["eta"] = trial.suggest_loguniform("eta", 1e-8, 1.0)
            # gamma ranges: [.01, 5] [0, 5] [1e-8, 1.]
            param["gamma"] = trial.suggest_loguniform("gamma", 1e-8, 5.)
            param["grow_policy"] = trial.suggest_categorical("grow_policy", ["depthwise", "lossguide"])

            # -- From towardsdatascience --
            # min_child_weight ranges: [1, 8]
            param["min_child_weight"] = trial.suggest_int("min_child_weight", 1, 8)
            # colsample_bytree ranges: [.3, .8] [.3, 1.]
            param["colsample_bytree"] = trial.suggest_float("colsample_bytree", .3, 1., step=.1)
            # subsample ranges: [.8, 1.] [.7, 1.]
            param["subsample"] = trial.suggest_float("subsample", .7, 1.)

        if param["booster"] == "dart":
            # -- From Optuna
            param["sample_type"] = trial.suggest_categorical("sample_type", ["uniform", "weighted"])
            param["normalize_type"] = trial.suggest_categorical("normalize_type", ["tree", "forest"])
            param["rate_drop"] = trial.suggest_loguniform("rate_drop", 1e-8, 1.0)
            param["skip_drop"] = trial.suggest_loguniform("skip_drop", 1e-8, 1.0)

        args = dict(
            # early_stopping_rounds range: [10] [100]
            early_stopping_rounds=trial.suggest_int("early_stopping_rounds", 10, 100, step=10),
            # n_estimators/num_boost_round ranges: [100, 1000] [10000]
            # https://stackoverflow.com/q/48051749/362790
            num_boost_round=trial.suggest_int("n_estimators", 100, 1000, step=100)
        )

        # print({**param, **args})

        xgb_cv_results = xgb.cv(
            params=param,
            dtrain=dtrain,
            nfold=N_FOLDS,
            # stratified=True,
            seed=SEED,
            verbose_eval=False,
            **args
        )

        # Set n_estimators as a trial attribute; Accessible via study.trials_dataframe().
        trial.set_user_attr("n_estimators", len(xgb_cv_results))

        # Save cross-validation results.
        filepath = os.path.join(CV_RESULT_DIR, "{}.csv".format(trial.number))
        xgb_cv_results.to_csv(filepath, index=False)

        # Extract the best score.
        best_score = xgb_cv_results["test-rmse-mean"].values[-1]

        self.results.append({
            'score': best_score,
            'rows': self.x.shape[0],
            'cols': self.x.shape[1],
            **param, **args
        })
        df = pd.DataFrame(self.results).sort_values("score")
        df.to_sql('xgb_hypers', engine, if_exists='replace')

        # Show importances of xgboost hypers (meta)
        if df.shape[0] > 5:
            x, y = df.drop(columns=['score']), df.score
            cats = np.where(x.dtypes == np.object)[0]
            x = x.fillna(0)
            dtrain = Pool(x, y, cat_features=cats)
            model = CatBoostRegressor(verbose=False).fit(dtrain)
            print()
            print("Feature Importances", feature_importances(model, df.columns))
            print()

        return best_score

    def optimize(self):
        if not os.path.exists(CV_RESULT_DIR):
            os.mkdir(CV_RESULT_DIR)

        study = optuna.create_study()
        study.optimize(self.objective, n_trials=500) #, timeout=600)

        print("Number of finished trials: ", len(study.trials))
        print("Best trial:")
        trial = study.best_trial

        print("  Value: {}".format(trial.value))
        print("  Params: ")
        for key, value in trial.params.items():
            print("    {}: {}".format(key, value))

        print("  Number of estimators: {}".format(trial.user_attrs["n_estimators"]))

        # shutil.rmtree(CV_RESULT_DIR)
