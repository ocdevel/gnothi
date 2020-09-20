import pickle, pdb
import common.models as M
import numpy as np
from sqlalchemy import text
from psycopg2.extras import Json as jsonb
from fastapi_sqlalchemy import db

import psycopg2, time
from uuid import uuid4
OFFLINE_MSG = "AI server offline, check back later"


def run_gpu_model(method, data):
    # AI offline (it's spinning up from views.py->cloud_updown.py)
    res = db.session.execute("select status from jobs_status limit 1").fetchone()
    if res.status != 'on':
        return False

    jid = M.Job.create_job(method=method, data_in=data)
    if not jid: return False
    jid = {'jid': jid}
    i = 0
    while True:
        time.sleep(1)
        res = db.session.execute(text("select state from jobs where id=:jid"), jid)
        state = res.fetchone().state

        # 5 seconds, still not picked up; something's wrong
        if i > 4 and state in ['new', 'error']:
            return False

        if state == 'done':
            job = db.session.execute(text("delete from jobs where id=:jid returning method, data_out"), jid).fetchone()
            db.session.commit()
            res = job.data_out
            if job.method == 'sentence-encode': res = np.array(res)
            return res
        i += 1


def run_influencers():
    return M.Job.create_job(method='influencers')
