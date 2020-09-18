import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import time, psycopg2, traceback, pdb, multiprocessing, threading, os
from psycopg2.extras import Json as jsonb
from box import Box
import torch
from sqlalchemy import text

# from books import run_books
from themes import themes
from influencers import influencers
from common.utils import utcnow
from common.database import session
from common.ec2_updown import notify_online
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


def run_job(job):
    jid_, k = str(job.id), job.method
    jid = {'jid': jid_}
    with session() as sess:
        data = sess.execute("select data_in from jobs where id=:jid", jid).fetchone().data_in
    args = data.get('args', [])
    kwargs = data.get('kwargs', {})

    logger.info(f"Running job {k}")

    if k == 'books':
        cmd = f"python books.py --jid={jid_} --uid={args[0]}"
        logger.info(cmd)
        os.system(cmd)
        return

    try:
        start = time.time()
        res = m[k](*args, **kwargs)
        with session() as sess:
            sess.execute(text(f"""
            update jobs set state='done', data_out=:data where id=:jid
            """), {'data': jsonb(res), **jid})
        logger.info(f"Job {k} complete {time.time() - start}")
    except Exception as err:
        err = str(traceback.format_exc())
        # err = str(err)
        res = {"error": err}
        with session() as sess:
            sess.execute(text(f"""
            update jobs set state='error', data_out=:data where id=:jid
            """), {'data': jsonb(res), **jid})
        logger.error(f"Job {k} error {time.time() - start} {err}")
    # 3eb71b3: unloading models. multiprocessing handles better


if __name__ == '__main__':
    logger.info(f"torch.cuda.current_device() {torch.cuda.current_device()}")
    logger.info(f"torch.cuda.device(0) {torch.cuda.device(0)}")
    logger.info(f"torch.cuda.device_count() {torch.cuda.device_count()}")
    logger.info(f"torch.cuda.get_device_name(0) {torch.cuda.get_device_name(0)}")
    logger.info(f"torch.cuda.is_available() {torch.cuda.is_available()}")
    logger.info("\n\n")

    # After 15 minutes of non-use, wipe all models.
    inactivity = 15 * 60

    with session() as sess:
        while True:
            # if active_jobs: GPUtil.showUtilization()
            status = notify_online(sess)

            # Find jobs
            job = sess.execute(f"""
            update jobs set state='working'
            where id = (select id from jobs where state='new' limit 1)
            returning id, method;
            """).fetchone()
            sess.commit()
            if not job:
                if status.elapsed_client > inactivity:
                    nlp_.clear()
                time.sleep(1)
                continue

            # aaf1ec95: multiprocessing.Process for problem models
            threading.Thread(target=run_job, args=(job,)).start()
            # run_job(job.id)
