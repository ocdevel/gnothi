from app.cleantext import unmark
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
    # AI offline (it's spinning up from views.py->ec2_updown.py)
    res = db.session.execute("select status from jobs_status limit 1").fetchone()
    if res.status != 'on':
        return False

    job = M.Jobs(method=method, data_in=data)
    db.session.add(job)
    db.session.commit()
    db.session.refresh(job)
    jid = {'jid': job.id}
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


def summarize(text, min_length=None, max_length=None, with_sentiment=True):
    args = [text]
    kwargs = {}
    if min_length: kwargs['min_length'] = min_length
    if max_length: kwargs['max_length'] = max_length
    kwargs['with_sentiment'] = with_sentiment
    res = run_gpu_model('summarization', dict(args=args, kwargs=kwargs))
    if res is False:
        return {"summary_text": OFFLINE_MSG, "sentiment": None}
    return res[0]


def query(question, entries):
    context = ' '.join([unmark(e) for e in entries])
    kwargs = dict(question=question, context=context)
    res = run_gpu_model('question-answering', dict(args=[], kwargs=kwargs))
    if res is False:
        return [{'answer': OFFLINE_MSG}]
    return res


def run_influencers():
    with db():
        job = M.Jobs(method='influencers', data_in={})
        db.session.add(job)
        db.session.commit()
        db.session.refresh(job)
        return job.id

def themes(entries):
    res = run_gpu_model('themes', dict(args=[entries], kwargs={}))
    if res is False:
        return []  # fixme
    return res
