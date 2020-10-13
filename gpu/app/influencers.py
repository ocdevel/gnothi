import pdb
from app.xgb_hyperopt import run_opt
from xgboost import XGBRegressor
from sqlalchemy import text
from psycopg2.extras import Json as jsonb
from sqlalchemy.dialects import postgresql
from common.utils import utcnow
from common.database import session
from common.fixtures import fixtures
import common.models as M
import pandas as pd
import numpy as np
import logging
logger = logging.getLogger(__name__)


def impute_and_roll(fes, fs):
    """Call this per field where past of nulls is removed"""
    for fid in fes.columns:
        dv = fs[fid].default_value
        dvv = fs[fid].default_value_value
        if not dv: continue  # should I just set to 0? can xgb handle nan?
        if dv == 'value':
            if not dvv: continue
            # FIXME getting SettingWithCopyWarning whether using .loc[:,x] or [x],
            # but it seems to work anyway... need to verify
            # fes[fid] = fes[fid].fillna(dvv)
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
    return fes.rolling(span, min_periods=1).mean().astype(np.float32)


def hyperopt(fes, fs, user_id):
    logging.info("Hyperopt")
    # See if this is tests+fixtures first
    fixt = fixtures.load_xgb_hypers(user_id)
    if fixt: return fixt


    # Find a good target to hyper-opt against, will use the same hypers for all targets
    good_target, nulls = None, None
    for t in fs.keys():
        nulls_ = fes[t].isnull().sum()
        if good_target is None or nulls_ < nulls:
            good_target, nulls = t, nulls_
    print(good_target, nulls)

    # hyper-opt
    fes_ = impute_and_roll(fes.copy(), fs)
    X_opt = fes_.drop(columns=[good_target])
    y_opt = fes_[good_target]
    hypers, _ = run_opt(X_opt, y_opt)
    if type(hypers) == str:
        print(hypers)  # it's an error
        hypers = {}
    else:
        for k in ['max_depth', 'n_estimators']:
            hypers[k] = int(hypers[k])
    print(hypers)
    fixtures.save_xgb_hypers(user_id, hypers)
    return hypers


def influencers_(user_id):
    logging.info("Influencers")
    with session() as sess:
        fes = pd.read_sql("""
        -- remove duplicates, use average. FIXME find the dupes bug
        with fe_clean as (
            select field_id, created_at::date, avg(value) as value
            from field_entries
            group by field_id, created_at::date
        ),
        -- ensure enough data
        fe_ct as (
          select field_id from fe_clean 
          group by field_id having count(value) > 5
        )
        select  
          fe.created_at, -- index 
          fe.field_id::text, -- column, uuid->string
          fe.value -- value
        from fe_clean fe
        inner join fe_ct on fe_ct.field_id=fe.field_id  -- just removes rows
        inner join fields f on f.id=fe.field_id
        where f.user_id=%(uid)s
          and f.excluded_at is null
        order by fe.created_at asc
        """, sess.bind, params={'uid': user_id})
        if not fes.size: return None  # not enough entries

        params = dict(
            uid=user_id,
            fids=tuple(fes.field_id.unique().tolist())
        )
        fs = pd.read_sql("""
        select id::text, default_value, default_value_value
        from fields
        where user_id=%(uid)s
            and id in %(fids)s
            and excluded_at is null
        """, sess.bind, params=params)

    fs = {r.id: r for i, r in fs.iterrows()}

    # Easier pivot debugging
    # fields['field_id'] =  fields.field_id.apply(lambda x: x[0:4])
    fes = fes.pivot(index='created_at', columns='field_id', values='value')

    # fes = fes.resample('D')
    cols = fes.columns.tolist()

    hypers = hyperopt(fes, fs, user_id)
    xgb_args = {}  # {'tree_method': 'gpu_hist', 'gpu_id': 0}

    next_preds = {}
    importances = {}
    all_imps = []
    for t in cols:
        # remove up until they start tracking; we'll impute from there on up
        fvi = fes[t].first_valid_index()
        fes_ = impute_and_roll(fes[fvi:].copy(), fs)

        ### Next Preds
        ### ----------
        # For next-pred, we keep target column. Yes, likely most predictive; but a rolling
        # trend is important info
        X = fes_
        y = X[t]
        model = XGBRegressor(**xgb_args, **hypers)
        model.fit(X, y)
        preds = model.predict(X.iloc[-1:])
        next_preds[t] = float(preds[0])
        # model.fit(X, y)  # what's this? was I fitting twice?

        ### Importances
        ### -----------
        X = fes_.drop(columns=[t])
        y = fes_[t]
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
        importances[t] = dict_

    all_imps = dict(pd.DataFrame(all_imps).mean())
    return next_preds, importances, all_imps


def influencers():
    with session() as sess:
        users = sess.execute(text(f"""
        select id::text from users
        where
          -- has logged in recently
          updated_at > {utcnow} - interval '2 days' and
          -- has been 1d since last-run (or never run)
          (extract(day from {utcnow} - last_influencers) >= 1 or last_influencers is null)
        """)).fetchall()
        for u in users:
            uid_ = dict(uid=u.id)
            sess.execute(text(f"""
            update users set last_influencers={utcnow} where id=:uid
            """), uid_)
            sess.commit()

            res = influencers_(u.id)
            if not res: continue

            # A field can get deleted while running XGB, causing a fkey constraint error.
            # https://docs.sqlalchemy.org/en/13/dialects/postgresql.html
            # Can't do on_conflict for FK constraints, get fresh ids and filter out missing ones.
            fids = [x.id for x in sess.execute(text("""
            select id::text from fields where user_id=:uid
            """), uid_).fetchall()]

            next_preds, importances, all_imps = res
            for fid, others in importances.items():
                if fid not in fids: continue
                inf_score, next_pred = all_imps[fid], next_preds[fid]

                insert = postgresql.insert(M.Influencer.__table__).values( [
                    dict(field_id=fid, influencer_id=inf_id, score=score)
                    for inf_id, score in others.items()
                    if inf_id in fids
                ])
                sess.execute(insert.on_conflict_do_update(
                    constraint=M.Influencer.__table__.primary_key,
                    set_=dict(score=insert.excluded.score)
                ))
                sess.execute(text("""
                update fields set influencer_score=:score, next_pred=:pred
                where id=:fid;
                """), dict(score=inf_score, pred=next_pred, fid=fid))
                sess.commit()

    return {}
