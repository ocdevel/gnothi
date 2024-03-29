from app.utils import logging
logger = logging.getLogger(__name__)

import time, psycopg2, traceback, pdb, multiprocessing, threading, os
from psycopg2.extras import Json as jsonb
from box import Box
import torch
from sqlalchemy import text

# app.from books import run_books
from app.themes import themes
from app.influencers import influencers
from common.utils import vars, is_prod
from common.database import with_db
import common.models as M
from common.cloud_updown import cloud_down_maybe
from app.nlp import nlp_
from app.books import run_books
from app.entries_profiles import entries, profiles

m = Box({
    # NLP
    'sentiment-analysis': nlp_.sentiment_analysis,
    'question-answering': nlp_.question_answering,
    'summarization': nlp_.summarization,

    # Caching
    'entries': entries,
    'profiles': profiles,
    'influencers': influencers,

    # Other
    'books': run_books,
    'themes': themes,
})


def run_job(job):
    jid_, k = str(job.id), job.method
    jid = {'jid': jid_}
    with with_db() as db:
        data = db.execute("select data_in from jobs where id=:jid", jid).fetchone().data_in
    args = data.get('args', [])
    kwargs = data.get('kwargs', {})

    if k in ('entries', 'profiles'):
        kwargs['job_id'] = jid_

    def fn(): return m[k](*args, **kwargs)
    M.Job.wrap_job(jid_, k, fn)
    # 3eb71b3: unloading models. multiprocessing handles better

if __name__ == '__main__':
    logger.info(f"torch.cuda.current_device() {torch.cuda.current_device()}")
    logger.info(f"torch.cuda.device(0) {torch.cuda.device(0)}")
    logger.info(f"torch.cuda.device_count() {torch.cuda.device_count()}")
    logger.info(f"torch.cuda.get_device_name(0) {torch.cuda.get_device_name(0)}")
    logger.info(f"torch.cuda.is_available() {torch.cuda.is_available()}")
    logger.info("\n\n")

    with with_db() as db:
        while True:
            M.Machine.notify_online(db, vars.MACHINE)
            cloud_down_maybe(db)

            # only allow 2 jobs at a time.
            if M.Machine.job_ct_on_machine(db, vars.MACHINE) >= 2:
                time.sleep(1)
                continue

            # Find jobs
            job = M.Job.take_job(db, "run_on='gpu'")
            if job:
                # aaf1ec95: multiprocessing.Process for problem models
                threading.Thread(target=run_job, args=(job,)).start()
                # run_job(job.id)

            if M.User.last_checkin(db) > 10 and is_prod():
                nlp_.clear()
            time.sleep(1)

