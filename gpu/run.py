import time, psycopg2, pickle, pdb, threading
from box import Box
import torch

from books import get_books
from themes import themes
from influencers import influencers
from utils import engine, cluster, cosine, clear_gpu
from nlp import nlp_

m = Box({
    'sentiment-analysis': nlp_.sentiment_analysis,
    'question-answering': nlp_.question_answering,
    'summarization': nlp_.summarization,
    'sentence-encode': nlp_.sentence_encode,

    'cosine': cosine,
    'influencers': influencers,
    'cluster': cluster,
    'books': get_books,
    'themes': themes,
})


def run_job(jid):
    job = engine.execute("select * from jobs where id=%s", (jid,)).fetchone()
    data = Box(pickle.loads(job.data))
    k = data.method

    print(f"Running job {k}")
    try:
        start = time.time()
        res = m[k](*data.args, **data.kwargs)
        # TODO pass results as byte-encoded json (json.dumps(obj).encode('utf-8') )
        res = pickle.dumps({'data': res})
        print('Timing', time.time() - start)
        sql = f"update jobs set state='done', data=%s where id=%s"
        engine.execute(sql, (psycopg2.Binary(res), job.id))
        print("Job complete")
    except Exception as err:
        err = str(err)
        print(err)
        res = pickle.dumps({"error": err})
        sql = f"update jobs set state='error', data=%s where id=%s"
        engine.execute(sql, (psycopg2.Binary(res), job.id))

    if k in nlp_.m:
        nlp_.unload(k)
    if k == 'themes':
        nlp_.unload('summarization')
    nlp_.unload('sentiment-analysis')  # try it anyway, used by themes / summary


if __name__ == '__main__':
    print('torch.cuda.current_device()', torch.cuda.current_device())
    print('torch.cuda.device(0)', torch.cuda.device(0))
    print('torch.cuda.device_count()', torch.cuda.device_count())
    print('torch.cuda.get_device_name(0)', torch.cuda.get_device_name(0))
    print('torch.cuda.is_available()', torch.cuda.is_available())
    print("\n\n")

    while True:
        # if active_jobs: GPUtil.showUtilization()

        # Notify is online.
        sql = "update jobs_status set status='on', ts_svc=now()"
        engine.execute(sql)

        # Find jobs
        sql = f"""
        update jobs set state='working'
        where id = (select id from jobs where state='new' limit 1)
        returning id
        """
        job = engine.execute(sql).fetchone()
        if not job:
            time.sleep(.5)
            continue

        threading.Thread(target=run_job, args=(job.id,), daemon=True).start()
