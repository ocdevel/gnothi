# Windows spawns recursive processes on question_answering() (bug?). Wrap whole script in
# __main__ to prevent this.
if __name__ == '__main__':
    import time, psycopg2, pickle, pdb, threading, os, json
    from box import Box
    import torch
    from sqlalchemy import create_engine

    def join_(paths):
        return os.path.join(os.path.dirname(__file__), *paths)
    config_json = json.load(open(join_(['config.json'])))
    engine = create_engine(
        config_json['DB_JOBS'].replace('host.docker.internal', 'localhost'),
        # config_json['DB_JOBS'],
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
    # sentence_encode = SentenceTransformer('roberta-base-nli-mean-tokens')
    sentence_encode = SentenceTransformer('roberta-base-nli-stsb-mean-tokens')

    def encode_pkl(path_):
        with open('server/' + path_, 'rb') as pkl:
            txts = pickle.load(pkl)
        vecs = sentence_encode.encode(txts)
        with open('server/' + path_, 'wb') as pkl:
            pickle.dump(vecs, pkl)
        return {'ok': True}

    # from transformers import pipeline
    from transformers import AutoTokenizer, AutoModelWithLMHead#, AutoModelForQuestionAnswering, AutoModelForSequenceClassification

    sent_tokenizer = AutoTokenizer.from_pretrained("mrm8488/t5-base-finetuned-emotion")
    sent_model = AutoModelWithLMHead.from_pretrained("mrm8488/t5-base-finetuned-emotion").to("cuda")
    def sentiment(text):
        input_ids = sent_tokenizer.encode(text + '</s>', return_tensors='pt', max_length=512).to("cuda")
        output = sent_model.generate(input_ids=input_ids, max_length=2)
        dec = [sent_tokenizer.decode(ids) for ids in output]
        label = dec[0]
        return [{"label": label, "score": 1.}]

    # Keeping Bart for now, max_length=1024 where T5=512. Switch to Longformer or LongBart when available
    # https://github.com/huggingface/transformers/issues/4406
    # TODO also not automatically using tokenizer max_length like it used to, getting srcIndex < srcSelectDimSize
    # when using pipeline()
    # https://github.com/huggingface/transformers/issues/4501
    # https://github.com/huggingface/transformers/issues/4224
    from transformers import BartForConditionalGeneration, BartTokenizer
    sum_tokenizer = BartTokenizer.from_pretrained('facebook/bart-large-cnn')
    sum_model = BartForConditionalGeneration.from_pretrained('facebook/bart-large-cnn').to("cuda")
    def summarize(text, max_length=None, min_length=None):
        input_ids = sum_tokenizer.encode(text, return_tensors='pt', max_length=1024, pad_to_max_length=True).to("cuda")
        # input_ids = sum_tokenizer.encode_plus(text, return_tensors='pt', max_length=1024, pad_to_max_length=True)["input_ids"].to("cuda")
        summary_ids = sum_model.generate(input_ids, max_length=max_length, min_length=min_length)
        summaries = [
            sum_tokenizer.decode(s, skip_special_tokens=True, clean_up_tokenization_spaces=False)
            for s in summary_ids
        ]
        summaries = [{"summary_text": x} for x in summaries]
        return summaries


    from transformers import LongformerTokenizer, LongformerForQuestionAnswering
    qa_tokenizer = LongformerTokenizer.from_pretrained("allenai/longformer-large-4096-finetuned-triviaqa")
    # qa_tokenizer = LongformerTokenizerFast.from_pretrained("allenai/longformer-large-4096-finetuned-triviaqa")
    qa_model = LongformerForQuestionAnswering.from_pretrained("allenai/longformer-large-4096-finetuned-triviaqa").to("cuda")
    # Revert to simple line, delete the rest when fixed: https://github.com/huggingface/transformers/issues/4934
    # Error: CUDA out of memory. Tried to allocate 3.11 GiB (GPU 0; 11.00 GiB total capacity; 6.97 GiB already allocated; 2.71 GiB free; 7.03 GiB reserved in total by PyTorch)
    # https://github.com/patrickvonplaten/notebooks/blob/master/How_to_evaluate_Longformer_on_TriviaQA_using_NLP.ipynb
    def qa_longformer(question, context):
        # TODO use trailing 4096 sequence, not leading
        encoding = qa_tokenizer.encode_plus(question, context, return_tensors="pt", max_length=4096)
        input_ids = encoding["input_ids"].to("cuda")
        attention_mask = encoding["attention_mask"].to("cuda")
        with torch.no_grad():
            start_scores, end_scores = qa_model(input_ids=input_ids, attention_mask=attention_mask)
        all_tokens = qa_tokenizer.convert_ids_to_tokens(encoding["input_ids"][0].tolist())
        answer_tokens = all_tokens[torch.argmax(start_scores): torch.argmax(end_scores) + 1]
        answer = qa_tokenizer.decode(qa_tokenizer.convert_tokens_to_ids(answer_tokens))[1:].replace('"', '')  # remove space prepending space token and remove unnecessary '"'
        return {'answer': answer}


    m = Box({
        'sentiment-analysis': sentiment,
        'question-answering': qa_longformer,
        'summarization': summarize,
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
