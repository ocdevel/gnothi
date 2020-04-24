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

    from transformers import pipeline, ModelCard
    from sentence_transformers import SentenceTransformer

    # from transformers import AutoTokenizer, AutoModelWithLMHead
    # tokenizer = AutoTokenizer.from_pretrained("google/electra-large-generator")
    # model = AutoModelWithLMHead.from_pretrained("google/electra-large-generator")

    sentence_encode = SentenceTransformer('roberta-base-nli-mean-tokens')

    m = Box({
        'sentiment-analysis': pipeline("sentiment-analysis", device=0),
        'question-answering': pipeline("question-answering", device=0),
        # 'summarization': pipeline("summarization", model="t5-base", tokenizer="t5-base", device=0),
        'summarization': pipeline("summarization", device=0),

        'sentence-encode': sentence_encode.encode
    })

    print("\n\n")

    def run_job(job):
        data = Box(pickle.loads(job.data))

        print(f"Running job {data.method}")
        try:
            start = time.time()
            torch.cuda.empty_cache()
            res = m[data.method](*data.args, **data.kwargs)
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
