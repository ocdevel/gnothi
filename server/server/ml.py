from server.database import engine
from server.cleantext import unmark
import pickle, pdb
import numpy as np


import psycopg2, time
from uuid import uuid4
OFFLINE_MSG = "AI server offline, check back later"


def run_gpu_model(data):
    # AI offline (it's spinning up from views.py->ec2_updown.py)
    res = engine.execute("select status from jobs_status limit 1").fetchone()
    if res.status != 'on':
        return False

    sql = f"insert into jobs values (%s, %s, %s)"
    jid = str(uuid4())
    engine.execute(sql, (jid, 'new', psycopg2.Binary(pickle.dumps(data))))
    i = 0
    while True:
        time.sleep(1)
        res = engine.execute("select state from jobs where id=%s", (jid,))
        state = res.fetchone().state

        # 5 seconds, still not picked up; something's wrong
        if i > 4 and state in ['new', 'error']:
            return False

        if state == 'done':
            job = engine.execute(f"select data from jobs where id=%s", (jid,)).fetchone()
            engine.execute("delete from jobs where id=%s", (jid,))
            res = pickle.loads(job.data)['data']
            if data['method'] == 'sentence-encode':
                res = np.array(res)
            return res
        i += 1


def summarize(text, min_length=None, max_length=None, with_sentiment=True):
    args = [text]
    kwargs = {}
    if min_length: kwargs['min_length'] = min_length
    if max_length: kwargs['max_length'] = max_length
    kwargs['with_sentiment'] = with_sentiment
    res = run_gpu_model(dict(method='summarization', args=args, kwargs=kwargs))
    if res is False:
        return {"summary_text": OFFLINE_MSG, "sentiment": None}
    return res[0]


def query(question, entries):
    context = ' '.join([unmark(e) for e in entries])
    kwargs = dict(question=question, context=context)
    res = run_gpu_model(dict(method='question-answering', args=[], kwargs=kwargs))
    if res is False:
        return [{'answer': OFFLINE_MSG}]
    return res


def influencers(user_id, specific_target=None):
    res = run_gpu_model(dict(
        method='influencers',
        args=[user_id],
        kwargs={'specific_target': specific_target}
    ))
    if res is False: return []  # fixme
    return res


def themes(entries):
    res = run_gpu_model(dict(method='themes', args=[entries], kwargs={}))
    if res is False:
        return []  # fixme
    return res


def books(user, bust=False):
    entries = [e.text for e in user.entries]
    entries = [user.profile_to_text()] + entries
    res = run_gpu_model(dict(method='books', args=[user.id, entries], kwargs={'bust': bust}))
    if res is False: return OFFLINE_MSG
    return res