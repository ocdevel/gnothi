# Windows spawns recursive processes on question_answering() (bug?). Wrap whole script in
# __main__ to prevent this.
if __name__ == '__main__':
    import time, psycopg2, pickle, pdb, threading
    from box import Box
    import GPUtil
    import torch
    from sqlalchemy import create_engine

    engine = create_engine(
        'postgres://postgres:mypassword@localhost:5433/ml_journal',
        pool_size=20,
        # pool_timeout=2,
        # pool_recycle=2
    )

    print('torch.cuda.current_device()', torch.cuda.current_device())
    print('torch.cuda.device(0)', torch.cuda.device(0))
    print('torch.cuda.device_count()', torch.cuda.device_count())
    print('torch.cuda.get_device_name(0)', torch.cuda.get_device_name(0))
    print('torch.cuda.is_available()', torch.cuda.is_available())

    from transformers import pipeline
    sentimenter = pipeline("sentiment-analysis")
    qa = pipeline("question-answering")
    summarizer = pipeline("summarization")

    # Kick this one off just to double-check we don't get infinite process spawn
    qa(question="who is john?", context="john is my friend.")

    print("\n\n")

    active_jobs = 0
    def run_job(job):
        global active_jobs
        active_jobs += 1

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
        sql = f"update jobs set state='done', data=%s where id=%s"
        engine.execute(sql, (psycopg2.Binary(data), job.id))
        print("Job complete")
        active_jobs -= 1


    while True:
        # if active_jobs: GPUtil.showUtilization()
        sql = f"""
        update jobs set state='working'
        where id = (select id from jobs where state='new' limit 1)
        returning *
        """
        job = engine.execute(sql).fetchone()
        if not job:
            time.sleep(1)
            continue

        threading.Thread(target=run_job, args=(job,), daemon=True).start()
