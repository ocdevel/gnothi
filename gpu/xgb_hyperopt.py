"""
https://towardsdatascience.com/an-example-of-hyperparameter-optimization-on-xgboost-lightgbm-and-catboost-using-hyperopt-12bc41a271e

TODO try LightGB for faster, see ^
"""

from hyperopt import hp
from hyperopt.pyll.base import scope
import numpy as np
from sklearn.metrics import mean_squared_error


# XGB parameters
xgb_reg_params = {
    # 'learning_rate':    hp.choice('learning_rate',    np.arange(0.05, 0.31, 0.05)),
    # 'max_depth':        hp.choice('max_depth',        np.arange(5, 16, 1, dtype=int)),
    # 'min_child_weight': hp.choice('min_child_weight', np.arange(1, 8, 1, dtype=int)),
    # 'colsample_bytree': hp.choice('colsample_bytree', np.arange(0.3, 0.8, 0.1)),
    # 'subsample':        hp.uniform('subsample', 0.8, 1),
    # 'n_estimators':     100,

    ## # Modifications from https://towardsdatascience.com/fine-tuning-xgboost-in-python-like-a-boss-b4543ed8b1e
    # usually between 0.1 and 0.01. If you’re focused on performance and have time in front of you, decrease incrementally the learning rate while increasing the number of trees.
    'learning_rate': hp.uniform('learning_rate', 0.01, 1.0),
    # the depth of each tree, which is the maximum number of different features used in each tree. I recommend going from a low max_depth (3 for instance) and then increasing it incrementally by 1, and stopping when there’s no performance gain of increasing it. This will help simplify your model and avoid overfitting
    'max_depth': scope.int(hp.quniform('max_depth', 2, 15, 1)),
    'min_child_weight': scope.int(hp.quniform('min_child_weight', 1, 8, 1)),
    # number of columns used by each tree. In order to avoid some columns to take too much credit for the prediction (think of it like in recommender systems when you recommend the most purchased products and forget about the long tail), take out a good proportion of columns. Values from 0.3 to 0.8 if you have many columns (especially if you did one-hot encoding), or 0.8 to 1 if you only have a few columns.
    'colsample_bytree': hp.uniform('colsample_bytree', 0.3, 1.),
    # which is for each tree the % of rows taken to build the tree. I recommend not taking out too many rows, as performance will drop a lot. Take values from 0.8 to 1.
    'subsample': hp.uniform('subsample', 0.7, 1),
    # usually misunderstood parameter, it acts as a regularization parameter. Either 0, 1 or 5.
    'gamma': hp.uniform('gamma', .01, 5),
    # 100 if the size of your data is high, 1000 is if it is medium-low
    'n_estimators': scope.int(hp.quniform('n_estimators', 100, 1000, 100)),  # small data
}
xgb_fit_params = {
    'eval_metric': 'rmse',
    'early_stopping_rounds': 10,
    'verbose': False
}
xgb_para = dict()
xgb_para['reg_params'] = xgb_reg_params
xgb_para['fit_params'] = xgb_fit_params
xgb_para['loss_func' ] = lambda y, pred: np.sqrt(mean_squared_error(y, pred))


# -----


import xgboost as xgb
from hyperopt import fmin, tpe, STATUS_OK, STATUS_FAIL, Trials


class HPOpt(object):

    def __init__(self, x_train, x_test, y_train, y_test):
        self.x_train = x_train
        self.x_test  = x_test
        self.y_train = y_train
        self.y_test  = y_test

    def process(self, fn_name, space, trials, algo, max_evals):
        fn = getattr(self, fn_name)
        try:
            result = fmin(fn=fn, space=space, algo=algo, max_evals=max_evals, trials=trials)
        except Exception as e:
            return {'status': STATUS_FAIL,
                    'exception': str(e)}
        return result, trials

    def xgb_reg(self, para):
        reg = xgb.XGBRegressor(**para['reg_params'])
        return self.train_reg(reg, para)


    def train_reg(self, reg, para):
        reg.fit(self.x_train, self.y_train,
                eval_set=[(self.x_train, self.y_train), (self.x_test, self.y_test)],
                **para['fit_params'])
        pred = reg.predict(self.x_test)
        loss = para['loss_func'](self.y_test, pred)
        return {'loss': loss, 'status': STATUS_OK}

from sklearn.model_selection import train_test_split
def run_opt(X, y):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
    obj = HPOpt(X_train, X_test, y_train, y_test)
    return obj.process(fn_name='xgb_reg', space=xgb_para, trials=Trials(), algo=tpe.suggest, max_evals=300)
