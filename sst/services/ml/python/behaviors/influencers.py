import pdb
from behaviors.xgb import MyXGB
from xgboost import XGBRegressor, DMatrix
from sqlalchemy import create_engine, text, Table, MetaData
from sqlalchemy.dialects import postgresql
from psycopg2.extras import Json as jsonb
import pandas as pd
import numpy as np
import logging
logger = logging.getLogger(__name__)

from behaviors.db import engine

metadata = MetaData()
influencers_table = Table('influencers', metadata, autoload_with=engine)


def good_target(fes, fs):
    # Find a good target to hyper-opt against, will use the same hypers for all targets
    gt, nulls = None, None
    for t in fs.keys():
        nulls_ = fes[t].isnull().sum()
        if gt is None or nulls_ < nulls:
            gt, nulls = t, nulls_
    # print(gt, nulls)
    return gt


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

# TODO put fixtures.load_xgb_hypers back

def load_data(conn, user_id):
    fes = pd.read_sql("""
    -- ensure enough data
    with fe_ct as (
      select field_id from field_entries2 
      group by field_id having count(value) > 5
    )
    select  
      fe.day, -- index 
      fe.field_id::text, -- column, uuid->string
      fe.value -- value
    from field_entries2 fe
    inner join fe_ct on fe_ct.field_id=fe.field_id  -- just removes rows
    inner join fields f on f.id=fe.field_id -- ensure field still exists? (cascade should be fine, remove?)
    where f.user_id=%(uid)s
      and f.excluded_at is null
    order by fe.day asc
    """, conn, params={'uid': user_id})
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
    """, conn, params=params)

    fs = {r.id: r for i, r in fs.iterrows()}

    # Easier pivot debugging
    # fields['field_id'] =  fields.field_id.apply(lambda x: x[0:4])
    fes = fes.pivot(index='day', columns='field_id', values='value')

    # Not enough to make predictions
    if fes.shape[0] < 4: return None

    return fs, fes


def get_prev_best(conn, user_id):
    """
    get x previous best hyper-runs for this user
    """
    # Ensure previous hyper-runs are up-to-date
    conn.execute(text("""
    delete from model_hypers where model='influencers' and model_version != :version 
    """), dict(version=MyXGB.version))

    prev_best = conn.execute(text("""
    select score, hypers from model_hypers where user_id=:uid and model='influencers'
    """), dict(uid=user_id)).fetchall()

    # clear older runs
    conn.execute(text("""
    with hypers_ as (
        select id from model_hypers where user_id=:uid and model='influencers'
        order by created_at desc
        limit 2
    ) delete from model_hypers where user_id=:uid and model='influencers' and id not in (select id from hypers_)
    """), dict(uid=user_id))

    if prev_best:
        return min([e.score for e in prev_best]), \
               [p.hypers for p in prev_best]
    else:
        return None


def influencers_(conn, user_id):
    logging.info("Influencers")

    data = load_data(conn, user_id)
    if not data: return
    fs, fes = data
    # fes = fes.resample('D')
    cols = fes.columns

    x, y = fes, good_target(fes, fs)
    x, y = x.drop(columns=[y]), x[y]
    xgb_args = {}
    prev_best = get_prev_best(conn, user_id)
    if prev_best:
        xgb_args['beat_this'] = prev_best[0]
        xgb_args['enqueue'] = prev_best[1]
    xgb_ = MyXGB(x, y, **xgb_args)
    xgb_.optimize()
    # save hypers & score for later enqueue_trial (see get_prev_best)
    if x.shape[0] > MyXGB.too_small:
        score, hypers = xgb_.best_value, xgb_.best_params
        meta = dict(n_rows=x.shape[0], n_cols=x.shape[1])
        conn.execute(text("""
        insert into model_hypers (model, model_version, user_id, score, hypers, meta)
        values ('influencers', :version, :uid, :score, :hypers, :meta)
        """), dict(version=xgb_.version, uid=user_id, score=score, hypers=jsonb(hypers), meta=jsonb(meta)))

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
        x = fes_
        y = x[t]
        y = y.fillna(y.mean())  # TODO use user-specified default
        model = xgb_.train(x, y)
        preds = model.predict(DMatrix(x.iloc[-1:]))
        next_preds[t] = float(preds[0])

        ### Importances
        ### -----------
        x = fes_.drop(columns=[t])
        y = fes_[t].fillna(fes_[t].mean()) # FIXME this was added for v0, since I was getting NaN. I have no memory of this code
        model = xgb_.train(x, y)

        imps = MyXGB.feature_importances(model)
        imps[t] = 0.
        all_imps.append(imps)
        importances[t] = imps

    all_imps = dict(pd.DataFrame(all_imps).mean())
    return next_preds, importances, all_imps


def main(event, context):
    with engine.connect() as conn:
        users = conn.execute(text("""
        select id::text from users
        where
          -- has logged in recently
          updated_at > now() - interval '2 days' and
          -- has been 1d since last-run (or never run)
          (extract(day from now() - last_influencers) >= 1 or last_influencers is null)
        """)).fetchall()
        for u in users:
            uid_ = dict(uid=u.id)
            conn.execute(text("""
            update users set last_influencers=now() where id=:uid
            """), uid_)

            res = influencers_(conn, u.id)
            if not res: continue

            # A field can get deleted while running XGB, causing a fkey constraint error.
            # https://docs.sqlalchemy.org/en/13/dialects/postgresql.html
            # Can't do on_conflict for FK constraints, get fresh ids and filter out missing ones.
            fids = [x.id for x in conn.execute(text("""
            select id::text from fields where user_id=:uid
            """), uid_).fetchall()]

            next_preds, importances, all_imps = res
            for fid, others in importances.items():
                if fid not in fids: continue
                inf_score, next_pred = all_imps[fid], next_preds[fid]

                influencers_update = [
                    dict(field_id=fid, influencer_id=inf_id, score=score)
                    for inf_id, score in others.items()
                    if (inf_id in fids # excluded fields deleted while this was running
                       and score > 0) # don't include non-influential scores (majority), save DB space
                ]
                print(influencers_update)

                # will be empty if all scores were 0, which isn't uncommon
                if influencers_update:
                    insert = postgresql.insert(influencers_table).values(influencers_update)
                    conn.execute(insert.on_conflict_do_update(
                        index_elements=["field_id", "influencer_id"],
                        set_=dict(score=insert.excluded.score)
                    ))
                conn.execute(text("""
                update fields set influencer_score=:score, next_pred=:pred
                where id=:fid;
                """), dict(score=inf_score, pred=next_pred, fid=fid))

    return {}

if __name__ == '__main__':
    with engine.connect() as conn:
        # FIXME remove
        conn.execute(text("update users set last_influencers=null where email='tylerrenelle@gmail.com'"))
    main(None, None)
