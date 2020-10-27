import pickle, pdb
from common.database import session
import common.models as M
import numpy as np
from box import Box
from sqlalchemy import text
from psycopg2.extras import Json as jsonb
from fastapi_sqlalchemy import db

import psycopg2, time
from uuid import uuid4
OFFLINE_MSG = "AI server offline, check back later"


def submit_job(method, data):
    # AI offline (it's spinning up from views.py->cloud_updown.py)
    status = M.Machine.gpu_status(db.session)
    if status == 'off':
        return False

    jid = M.Job.create_job(method=method, data_in=data)
    if not jid: return False

    return dict(
        jid=jid,
        queue=M.Job.place_in_queue(jid)
    )


def await_job(jid):
    with session() as sess:
        params = {'jid': jid}
        i = 0
        while True:
            time.sleep(1)
            job = sess.execute(text("""
            select state, method from jobs where id=:jid
            """), params).fetchone()

            # TODO notify them of error?
            # 10 minutes, give up
            if job.state == 'error' or i > 60*10:
                return Box(method=job.method, data_out=False)

            if job.state == 'done':
                job = sess.execute(text("""
                select method, data_out from jobs where id=:jid
                """), params).fetchone()
                sess.commit()
                return job
            i += 1


def run_influencers():
    return M.Job.create_job(method='influencers')
