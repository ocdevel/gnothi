import time, psycopg2, pickle, pdb, multiprocessing, threading
from box import Box
import torch
import socket
from sqlalchemy import text

from books import predict_books
from themes import themes
from influencers import influencers
from utils import SessLocal, cluster, cosine, clear_gpu
from nlp import nlp_

m = Box({
    'sentiment-analysis': nlp_.sentiment_analysis,
    'question-answering': nlp_.question_answering,
    'summarization': nlp_.summarization,
    'sentence-encode': nlp_.sentence_encode,

    'cosine': cosine,
    'influencers': influencers,
    'cluster': cluster,
    'books': predict_books,
    'themes': themes,
})


def run_job(jid):
    sess = SessLocal.main()
    job = sess.execute("select * from jobs where id=:jid", {'jid': jid}).fetchone()
    k = job.method
    data = Box(pickle.loads(job.data))

    print(f"Running job {k}")
    try:
        start = time.time()
        res = m[k](*data.args, **data.kwargs)
        # TODO pass results as byte-encoded json (json.dumps(obj).encode('utf-8') )
        res = pickle.dumps({'data': res})
        print('Timing', time.time() - start)
        sql = text(f"update jobs set state='done', data=:data where id=:jid")
        sess.execute(sql, {'data': psycopg2.Binary(res), 'jid': job.id})
        print("Job complete")
    except Exception as err:
        err = str(err)
        print(err)
        res = pickle.dumps({"error": err})
        sql = text(f"update jobs set state='error', data=:data where id=:jid")
        sess.execute(sql, {'data': psycopg2.Binary(res), 'jid': job.id})
    sess.close()

    # 3eb71b3: unloading models. multiprocessing handles better


if __name__ == '__main__':
    print('torch.cuda.current_device()', torch.cuda.current_device())
    print('torch.cuda.device(0)', torch.cuda.device(0))
    print('torch.cuda.device_count()', torch.cuda.device_count())
    print('torch.cuda.get_device_name(0)', torch.cuda.get_device_name(0))
    print('torch.cuda.is_available()', torch.cuda.is_available())
    print("\n\n")

    sess = SessLocal.main()
    inactivity = 15 * 60  # 15 minutes
    while True:
        # if active_jobs: GPUtil.showUtilization()

        # Notify is online.
        sql = "update jobs_status set status='on', ts_svc=now(), svc=:svc"
        sess.execute(text(sql), {'svc': socket.gethostname()})

        # Find jobs
        sql = f"""
        update jobs set state='working'
        where id = (select id from jobs where state='new' limit 1)
        returning id, method
        """
        job = sess.execute(sql).fetchone()
        if not job:
            sql = f"""
            select extract(epoch FROM (now() - ts_client)) as elapsed_client
            from jobs_status;
            """
            if sess.execute(sql).fetchone().elapsed_client > inactivity:
                nlp_.clear()

            time.sleep(.5)
            continue

        # Threading keeps models around for re-use (cleared after inactivity)
        # Multiprocessing fully wipes the process after run. Keras/TF has model-training memleak & can't recover GPU
        # RAM, so just run books in Process https://github.com/tensorflow/tensorflow/issues/36465#issuecomment-582749350
        if job.method == 'books':
            multiprocessing.Process(target=run_job, args=(job.id,)).start()
        else:
            threading.Thread(target=run_job, args=(job.id,)).start()
        # run_job(job.id)
    sess.close()
