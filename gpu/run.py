if __name__ == '__main__':
    import time, psycopg2, pickle, pdb, threading
    from box import Box
    import torch
    from books import books
    from themes import themes
    from influencers import influencers
    from utils import engine, cluster, cosine
    from nlp import sentiment, qa_longformer, summarize, sentence_encode


    m = Box({
        'sentiment-analysis': sentiment,
        'question-answering': qa_longformer,
        'summarization': summarize,
        'sentence-encode': sentence_encode,
        'cosine': cosine,
        'influencers': influencers,
        'cluster': cluster,
        'books': books,
        'themes': themes,
    })

    print("\n\n")

    def run_job(jid):
        job = engine.execute("select * from jobs where id=%s", (jid,)).fetchone()
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
