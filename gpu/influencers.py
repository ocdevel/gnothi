import pdb
from xgb_hyperopt import run_opt
from xgboost import XGBRegressor
from sqlalchemy import text
from psycopg2.extras import Json as jsonb
from common.utils import utcnow
from common.database import SessLocal
import pandas as pd
import numpy as np

def influencers_(user_id):
    sess = SessLocal.main()
    fes = pd.read_sql("""
    select  
        fe.created_at::date, -- index 
        fe.field_id, -- column
        fe.value -- value
    from field_entries fe
    inner join fields f on f.id=fe.field_id
    where fe.user_id=%(user_id)s
        -- exclude these to improve model perf
        -- TODO reconsider for past data
        and f.excluded_at is null
    order by fe.created_at asc
    """, sess.bind, params={'user_id': user_id})
    # uuid as string
    fes['field_id'] = fes.field_id.apply(str)

    before_ct = fes.shape[0]
    fes = fes.drop_duplicates(['created_at', 'field_id'], keep='last')
    if before_ct != fes.shape[0]:
        print(f"{before_ct - fes.shape[0]} Duplicates")

    fs = pd.read_sql("""
    select id, target, default_value, default_value_value
    from fields
    where user_id=%(user_id)s
        and excluded_at is null
    """, sess.bind, params={'user_id': user_id})
    fs['id'] = fs.id.apply(str)
    sess.close()

    target_ids = fs[fs.target == True].id.values
    fs = {str(r.id): r for i, r in fs.iterrows()}

    # Easier pivot debugging
    # fields['field_id'] =  fields.field_id.apply(lambda x: x[0:4])
    fes = fes.pivot(index='created_at', columns='field_id', values='value')

    # fes = fes.resample('D')
    cols = fes.columns.tolist()

    # Find a good target to hyper-opt against, will use the same hypers for all targets
    good_target = (0, target_ids[0])
    for t in target_ids:
        ct = fes[t].isnull().sum()
        if ct < good_target[0]:
            good_target = (ct, t)
    print(good_target)
    good_target = good_target[1]

    # TODO resample on Days
    for fid in fes.columns:
        dv = fs[fid].default_value
        dvv = fs[fid].default_value_value
        if not dv: continue
        if dv == 'value':
            if not dvv: continue
            fes[fid] = fes[fid].fillna(dvv)
        elif dv == 'ffill':
            fes[fid] = fes[fid].fillna(method='ffill') \
                .fillna(method='bfill')
        elif dv == 'average':
            fes[fid] = fes[fid].fillna(fes[fid].mean())

    # This part is important. Rather than say "what today predicts y" (not useful),
    # or even "what history predicts y" (would be time-series models, which don't have feature_importances_)
    # we can approximate it a rolling average of activity.
    # TODO not sure which window fn to use: rolling|expanding|ewm?
    # https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.rolling.html
    # http://people.duke.edu/~ccc14/bios-823-2018/S18A_Time_Series_Manipulation_Smoothing.html#Window-functions
    span = 3
    fes = fes.rolling(span, min_periods=1).mean().astype(np.float16)

    # hyper-opt

    X_opt = fes.drop(columns=[good_target])
    y_opt = fes[good_target]
    hypers, _ = run_opt(X_opt, y_opt)
    for k in ['max_depth', 'n_estimators']:
        hypers[k] = int(hypers[k])
    print(hypers)
    xgb_args = {}  # {'tree_method': 'gpu_hist', 'gpu_id': 0}

    # predictions
    next_preds = {}
    for c in cols:
        # we keep target column. Yes, likely most predictive; but a rolling
        # trend is important info
        X = fes
        y = X[c]
        model = XGBRegressor(**xgb_args, **hypers)
        model.fit(X, y)
        preds = model.predict(X.iloc[-1:])
        next_preds[c] = float(preds[0])
        model.fit(X, y)

    # importances
    targets = {}
    all_imps = []
    for t in target_ids:
        X = fes.drop(columns=[t])
        y = fes[t]
        model = XGBRegressor(**xgb_args, **hypers)
        model.fit(X, y)
        imps = [float(x) for x in model.feature_importances_]

        # FIXME
        # /xgboost/sklearn.py:695: RuntimeWarning: invalid value encountered in true_divide return all_features / all_features.sum()
        # I think this is due to target having no different value, in which case
        # just leave like this.
        imps = [0. if np.isnan(imp) else imp for imp in imps]

        # put target col back in
        imps.insert(cols.index(t), 0.0)
        dict_ = dict(zip(cols, imps))
        all_imps.append(dict_)
        targets[t] = dict_

    all_imps = dict(pd.DataFrame(all_imps).mean())

    return (targets, all_imps, next_preds)

def influencers():
    sess = SessLocal.main()
    users = sess.execute(text(f"""
    with fe_ct as (
        select user_id, count(*) ct from field_entries 
        group by user_id having count(*) > 15
    )
    select u.id from users u
    inner join fe_ct on fe_ct.user_id=u.id
    left outer join cache_users c on c.user_id=u.id
    where
      -- has logged in recently
      u.updated_at > {utcnow} - interval '2 days' and
      -- has been 1d since last-run (or never run)
      (extract(day from {utcnow} - c.last_influencers) >= 1 or c.last_influencers is null)
    """)).fetchall()
    for u in users:
        uid = str(u.id)
        res = influencers_(uid)
        sess.execute(text(f"""
        insert into cache_users (user_id, last_influencers, influencers) values (:uid, {utcnow}, :data)
        on conflict (user_id) do update set last_influencers={utcnow}, influencers=:data
        """), {'uid': uid, 'data': jsonb(res)})
        sess.commit()
    sess.close()
