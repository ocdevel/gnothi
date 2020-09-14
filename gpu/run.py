import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import time, psycopg2, traceback, pdb, multiprocessing, threading, os
from psycopg2.extras import Json as jsonb
from box import Box
import torch
import socket
from sqlalchemy import text

# from books import run_books
from themes import themes
from influencers import influencers
from common.utils import utcnow
from common.database import session, engine
from common.ec2_updown import ec2_down_maybe
from utils import cluster, cosine, clear_gpu
from nlp import nlp_

m = Box({
    # NLP
    'sentiment-analysis': nlp_.sentiment_analysis,
    'question-answering': nlp_.question_answering,
    'summarization': nlp_.summarization,
    'sentence-encode': nlp_.sentence_encode,

    # Caching
    'entry': nlp_.entry,
    'profile': nlp_.profile,
    'influencers': influencers,


    # Other
    'cosine': cosine,
    'cluster': cluster,
    # 'books': run_books,
    'themes': themes,
})

def remove_stale_jobs(sess):
    sql = f"""
    delete from jobs
    where created_at < {utcnow} - interval '1 hour';
    """
    sess.execute(sql)


def run_job(job):
    jid_, k = str(job.id), job.method
    jid = {'jid': jid_}
    with session() as sess:
        data = sess.execute("select data_in from jobs where id=:jid", jid).fetchone().data_in
    args = data.get('args', [])
    kwargs = data.get('kwargs', {})

    logger.info(f"Running job {k}")

    if k == 'books':
        os.system(f"python books.py --jid={jid_} --uid={args[0]}")
        return

    sql, params = None, None
    try:
        start = time.time()
        res = m[k](*args, **kwargs)
        sql = text(f"update jobs set state='done', data_out=:data where id=:jid")
        params = {'data': jsonb(res), **jid}
        logger.info(f"Job Complete {time.time() - start}")
    except Exception as err:
        err = str(traceback.format_exc())
        # err = str(err)
        res = {"error": err}
        sql = text(f"update jobs set state='error', data_out=:data where id=:jid")
        params = {'data': jsonb(res), **jid}
        logger.info(f"Job Error {time.time() - start} {err}")
    with session() as sess:
        sess.execute(sql, params)
        remove_stale_jobs(sess)

    # 3eb71b3: unloading models. multiprocessing handles better


if __name__ == '__main__':
    logger.info(f"torch.cuda.current_device() {torch.cuda.current_device()}")
    logger.info(f"torch.cuda.device(0) {torch.cuda.device(0)}")
    logger.info(f"torch.cuda.device_count() {torch.cuda.device_count()}")
    logger.info(f"torch.cuda.get_device_name(0) {torch.cuda.get_device_name(0)}")
    logger.info(f"torch.cuda.is_available() {torch.cuda.is_available()}")
    logger.info("\n\n")

    inactivity = 15 * 60  # 15 minutes
    while True:
        # if active_jobs: GPUtil.showUtilization()

        # Notify is online.
        sql = f"update jobs_status set status='on', ts_svc={utcnow}, svc=:svc"
        engine.execute(text(sql), svc=socket.gethostname())

        # Find jobs
        sql = f"""
        update jobs set state='working'
        where id = (select id from jobs where state='new' limit 1)
        returning id, method;
        """
        job = engine.execute(sql).fetchone()
        if not job:
            ec2_down_maybe()
            sql = f"""
            select extract(epoch FROM ({utcnow} - ts_client)) as elapsed_client
            from jobs_status;
            """
            if engine.execute(sql).fetchone().elapsed_client > inactivity:
                nlp_.clear()

            time.sleep(.5)
            continue

        # Threading keeps models around for re-use (cleared after inactivity)
        # Multiprocessing fully wipes the process after run. Keras/TF has model-training memleak & can't recover GPU
        # RAM, so just run books in Process https://github.com/tensorflow/tensorflow/issues/36465#issuecomment-582749350
        # FIXME Running influencers in process too because it crashes sometimes. Find solution
        if job.method in []:  # ['books', 'influencers']:
            multiprocessing.Process(target=run_job, args=(job,)).start()
        else:
            threading.Thread(target=run_job, args=(job,)).start()
        # run_job(job.id)
