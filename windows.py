# Windows spawns recursive processes on question_answering() (bug?). Wrap whole script in
# __main__ to prevent this.
if __name__ == '__main__':
    import time, psycopg2, pickle, pdb, threading, os, json
    from box import Box
    import GPUtil
    import torch
    from sqlalchemy import create_engine

    def join_(paths):
        return os.path.join(os.path.dirname(__file__), *paths)
    config_json = json.load(open(join_(['server', 'jwtauthtest', 'config.json'])))
    engine = create_engine(
        config_json['DB_JOBS'].replace('host.docker.internal', 'localhost'),
        pool_size=20,
        # pool_timeout=2,
        # pool_recycle=2
    )

    print('torch.cuda.current_device()', torch.cuda.current_device())
    print('torch.cuda.device(0)', torch.cuda.device(0))
    print('torch.cuda.device_count()', torch.cuda.device_count())
    print('torch.cuda.get_device_name(0)', torch.cuda.get_device_name(0))
    print('torch.cuda.is_available()', torch.cuda.is_available())

    from sentence_transformers import SentenceTransformer
    sentence_encode = SentenceTransformer('roberta-base-nli-mean-tokens')

    def encode_pkl(path_):
        with open('server/' + path_, 'rb') as pkl:
            txts = pickle.load(pkl)
        vecs = sentence_encode.encode(txts)
        with open('server/' + path_, 'wb') as pkl:
            pickle.dump(vecs, pkl)
        return {'ok': True}

    from transformers import pipeline, ModelCard
    from transformers import AutoTokenizer, AutoModelWithLMHead, AutoModelForQuestionAnswering

    # models that have been fine-tuned on a sequence classification task
    sent_args = dict(
        
    )

    sum_args = dict(
        # tokenizer=AutoTokenizer.from_pretrained("google/electra-large-generator")
        # model=AutoModelWithLMHead.from_pretrained("google/electra-large-generator")
        # model="t5-base",
        # tokenizer="t5-base"
    )

    qa_args = dict(
        tokenizer=AutoTokenizer.from_pretrained("twmkn9/albert-base-v2-squad2"),
        model=AutoModelForQuestionAnswering.from_pretrained("twmkn9/albert-base-v2-squad2"),
        # tokenizer=AutoTokenizer.from_pretrained("ktrapeznikov/albert-xlarge-v2-squad-v2"),
        # model=AutoModelForQuestionAnswering.from_pretrained("ktrapeznikov/albert-xlarge-v2-squad-v2")
    )

    m = Box({
        'sentiment-analysis': pipeline("sentiment-analysis", device=0, **sent_args),
        'question-answering': pipeline("question-answering", device=0, **qa_args),
        'summarization': pipeline("summarization", device=0, **sum_args),
        'sentence-encode': sentence_encode.encode,
        'sentence-encode-pkl': encode_pkl,
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
