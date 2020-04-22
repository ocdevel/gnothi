import time, psycopg2, pickle, pdb, threading
from box import Box
import torch
from sqlalchemy import create_engine

engine = create_engine('postgres://postgres:mypassword@localhost:5433/ml_journal')

print('torch.cuda.current_device()', torch.cuda.current_device())
print('torch.cuda.device(0)', torch.cuda.device(0))
print('torch.cuda.device_count()', torch.cuda.device_count())
print('torch.cuda.get_device_name(0)', torch.cuda.get_device_name(0))
print('torch.cuda.is_available()', torch.cuda.is_available())

from transformers import pipeline
sentimenter = pipeline("sentiment-analysis")
qa = pipeline("question-answering")
summarizer = pipeline("summarization")

print("\n\n\n\n")

def run_job(job):
    data = Box(pickle.loads(job.data))

    print(f"Running job {data.method}")

    start = time.time()
    if data.method == 'summarize':
        res = summarizer(data.text, min_length=data.min_length, max_length=data.max_length)
    elif data.method == 'sentiment':
        res = sentimenter(data.text)
    elif data.method == 'qa':
        res = qa(question=data.question, context=data.context)
    print('Timing', time.time() - start)

    data = pickle.dumps({'data': res})
    with engine.connect() as conn:
        sql = f"update jobs set state='done', data=%s where id=%s"
        conn.execute(sql, (psycopg2.Binary(data), job.id))
    print("Job complete")

def check_jobs():
    with engine.connect() as conn:
        sql = f"""
        update jobs set state='working'
        where id = (select id from jobs where state='new' limit 1)
        returning *
        """
        job = conn.execute(sql).fetchone()
    if not job:
        time.sleep(1)
        return

    x = threading.Thread(target=run_job, args=(job,), daemon=True)
    x.start()


if __name__ == '__main__':
    while True: check_jobs()
