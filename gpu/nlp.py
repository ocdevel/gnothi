import math, time, pdb
import torch
import keras.backend as K
import numpy as np
from common.database import SessLocal
import common.models as M
from sqlalchemy import text as satext
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModelWithLMHead#, AutoModelForQuestionAnswering, AutoModelForSequenceClassification
from transformers import BartForConditionalGeneration, BartTokenizer
from transformers import LongformerTokenizer, LongformerForQuestionAnswering

AVG_WORD_SIZE = 5

class NLP():
    def __init__(self):
        self.m = {}

    def load(self, k):
        while self.m.get(k, None) == -1:
            time.sleep(1)  # loading, wit till ready
        if self.m.get(k, None) is not None:
            return self.m[k]  # it's already loaded
        self.m[k] = -1  # tell others it's loading, wait
        m = None
        if k == 'sentence-encode':
            m = SentenceTransformer('roberta-base-nli-stsb-mean-tokens')
            # word_embedding_model = models.Transformer('allenai/longformer-base-4096')
            # pooling_model = models.Pooling(word_embedding_model.get_word_embedding_dimension())
            # m = SentenceTransformer(modules=[word_embedding_model, pooling_model])
        elif k == 'sentiment-analysis':
            tokenizer = AutoTokenizer.from_pretrained("mrm8488/t5-base-finetuned-emotion")
            model = AutoModelWithLMHead.from_pretrained("mrm8488/t5-base-finetuned-emotion").to("cuda")
            m = (tokenizer, model)
        elif k == 'summarization':
            # Keeping Bart for now, max_length=1024 where T5=512. Switch to Longformer or LongBart when available
            # https://github.com/huggingface/transformers/issues/4406
            # TODO also not automatically using tokenizer max_length like it used to, getting srcIndex < srcSelectDimSize
            # when using pipeline()
            # https://github.com/huggingface/transformers/issues/4501
            # https://github.com/huggingface/transformers/issues/4224
            tokenizer = BartTokenizer.from_pretrained('facebook/bart-large-cnn')
            model = BartForConditionalGeneration.from_pretrained('facebook/bart-large-cnn').to("cuda")
            m = (tokenizer, model)
        elif k == 'question-answering':
            tokenizer = LongformerTokenizer.from_pretrained("allenai/longformer-large-4096-finetuned-triviaqa")
            # tokenizer = LongformerTokenizerFast.from_pretrained("allenai/longformer-large-4096-finetuned-triviaqa")
            model = LongformerForQuestionAnswering.from_pretrained("allenai/longformer-large-4096-finetuned-triviaqa").to("cuda")
            # Revert to simple line, delete the rest when fixed: https://github.com/huggingface/transformers/issues/4934
            # Error: CUDA out of memory. Tried to allocate 3.11 GiB (GPU 0; 11.00 GiB total capacity; 6.97 GiB already allocated; 2.71 GiB free; 7.03 GiB reserved in total by PyTorch)
            # https://github.com/patrickvonplaten/notebooks/blob/master/How_to_evaluate_Longformer_on_TriviaQA_using_NLP.ipynb
            m = (tokenizer, model)
        self.m[k] = m
        return m

    def clear(self):
        if not self.m: return
        print("Clearing GPU RAM")
        self.m = {}
        K.clear_session()
        torch.cuda.empty_cache()

    def sentence_encode(self, x):
        m = self.load('sentence-encode')
        return np.array(m.encode(x, batch_size=128, show_progress_bar=True))

    # TODO chunk sentiment? (or is it fine with chunked summaries?)
    def sentiment_analysis(self, text):
        if not text:
            return [{"label": "", "score": 1.}]
        tokenizer, model = self.load('sentiment-analysis')

        max_tokens = 512
        input_ids = tokenizer.encode(text + '</s>', return_tensors='pt', max_length=max_tokens).to("cuda")
        output = model.generate(input_ids=input_ids, max_length=2)
        dec = [tokenizer.decode(ids) for ids in output]
        label = dec[0]
        return [{"label": label, "score": 1.}]

    def summarization(self, text, max_length=None, min_length=None, with_sentiment=True):
        if not text:
            return [{"summary_text": "Nothing to summarize (try adjusting date range)"}]
        tokenizer, model = self.load('summarization')

        sum_max = 1024
        tokens_all = tokenizer.encode(text, return_tensors='pt').to("cuda")
        if max_length and tokens_all.shape[1] <= max_length:
            return [{"summary_text": text, "sentiment": ""}]
        n_parts = math.ceil(tokens_all.shape[1] / sum_max)
        tokens_all = tokenizer.encode(text, return_tensors='pt', max_length=sum_max * n_parts, pad_to_max_length=True).to("cuda")
        sum_args = dict(num_beams=4, early_stopping=True)
        if n_parts == 1:
            summary_ids = model.generate(tokens_all, max_length=max_length, min_length=min_length, **sum_args)
        else:
            max_part = int(max_length / n_parts) if max_length else None
            summary_ids = []
            for i in range(n_parts):
                min_part = None
                if min_length and i < (n_parts - 1):
                    min_part = int(min_length / n_parts)
                tokens_part = tokens_all[:, i * sum_max: (i + 1) * sum_max]
                # FIXME generate as batch ([batch_size, tokens])
                summary_ids += model.generate(tokens_part, max_length=max_part, min_length=min_part, **sum_args)
            summary_ids = torch.cat(summary_ids).unsqueeze(0)
            ## Min/max size already accounted for above
            # summary_ids = sum_model.generate(summary_ids, max_length=max_length, min_length=min_length)
        summary = [
            tokenizer.decode(s, skip_special_tokens=True, clean_up_tokenization_spaces=False)
            for s in summary_ids
        ]
        summary = summary[0]
        sentiment = self.sentiment_analysis(summary)[0]["label"] if with_sentiment else ""
        return [{"summary_text": summary, "sentiment": sentiment}]

    def question_answering(self, question, context):
        if not context:
            return [{'answer': "Not enough entries to use this feature."}]
        tokenizer, model = self.load('question-answering')

        qa_max = 4096
        # FIXME use smarter 4096 recent tokens here
        answers = []
        max_chars = qa_max * AVG_WORD_SIZE
        for i in range(int(len(context) / max_chars)):
            context_ = context[i * max_chars:(i + 1) * max_chars]
            encoding = tokenizer.encode_plus(question, context_, return_tensors="pt", max_length=qa_max)
            input_ids = encoding["input_ids"].to("cuda")
            attention_mask = encoding["attention_mask"].to("cuda")
            with torch.no_grad():
                start_scores, end_scores = model(input_ids=input_ids, attention_mask=attention_mask)
            all_tokens = tokenizer.convert_ids_to_tokens(encoding["input_ids"][0].tolist())
            answer_tokens = all_tokens[torch.argmax(start_scores): torch.argmax(end_scores) + 1]
            # remove space prepending space token and remove unnecessary '"'
            answer = tokenizer.decode(tokenizer.convert_tokens_to_ids(answer_tokens))[1:].replace('"', '')
            if len(answer) > 200:
                answer = self.summarization(answer, max_length=20)[0]["summary_text"]
            if answer not in answers:
                answers.append(answer)
        if not answers: return [{'answer': 'No answer'}]
        return [{'answer': a} for a in answers]

    def entry(self, id):
        sess = SessLocal.main()
        entry = sess.query(M.Entry).get(id)
        res = self.summarization(entry.text, 5, 20, with_sentiment=False)
        entry.title_summary = res[0]["summary_text"]
        res = self.summarization(entry.text, 32, 128)
        entry.text_summary = res[0]["summary_text"]
        entry.sentiment = res[0]["sentiment"]
        entry.ai_ran = True
        sess.commit()

        # every x entries, update book recommendations
        user = sess.query(M.User).get(entry.user_id)
        sql = 'select count(*)%2=0 as ct from entries where user_id=:uid'
        should_update = sess.execute(satext(sql), {'uid': user.id}).fetchone().ct
        if should_update:
            sess.add(M.Jobs(
                method='books',
                data={'kwargs': {'id': str(user.id)}}
            ))
            sess.commit()

        # Clean up broken entries
        broken = "select id from entries where ai_ran!=true limit 1"
        broken = sess.execute(broken).fetchone()
        sess.close()
        if broken: self.entry(entry.id)
        return {}


nlp_ = NLP()
