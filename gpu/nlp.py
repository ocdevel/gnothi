import math, time, pdb
import torch
import keras.backend as K
import numpy as np
from common.database import SessLocal
import common.models as M
from sqlalchemy import text as satext
from cleantext import Clean
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

    def summarization(self, text, min_length=None, max_length=None, with_sentiment=True):
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

    def _prep_entry_cache(self, txt):
        paras = Clean.entries_to_paras([txt])
        clean = [' '.join(e) for e in Clean.lda_texts(paras, propn=True)]
        vecs = self.sentence_encode(paras).tolist()
        return paras, clean, vecs

    def entry(self, id=None):
        sess = SessLocal.main()
        e = sess.query(M.Entry).filter(M.Entry.no_ai.isnot(True))
        e = e.filter(M.Entry.id == id) if id else\
            e.filter(M.Entry.ai_ran.isnot(True)) # look for other entries to cleanup
        e = e.first()
        if not e: return {}
        root_call = bool(id)
        id = e.id

        # Run summaries
        try:
            res = self.summarization(e.text, 5, 20, with_sentiment=False)
            e.title_summary = res[0]["summary_text"]
            res = self.summarization(e.text, 32, 128)
            e.text_summary = res[0]["summary_text"]
            e.sentiment = res[0]["sentiment"]
        except Exception as err:
            print(err)
        e.ai_ran = True
        sess.commit()

        # Run clean-text & vectors for themes/books
        c_entry = sess.query(M.CacheEntry).get(id)
        if not c_entry:
            c_entry = M.CacheEntry(entry_id=id)
            sess.add(c_entry)
        c_entry.paras, c_entry.clean, c_entry.vectors = self._prep_entry_cache(e.text)

        # 9131155e: only update every x entries
        if root_call:
            sess.add(M.Job(
                method='books',
                data_in={'args': [str(e.user_id)]}
            ))

        sess.commit()
        sess.close()
        # recurse to process any left-behind entries
        return self.entry()

    def profile(self, id):
        sess = SessLocal.main()
        profile_txt = sess.query(M.User).get(id).profile_to_text()
        cu = M.CacheUser
        if profile_txt:
            c_profile = sess.query(cu).get(id)
            # TODO can't use with_entities & model.get(). This fetches cu.influencers too, large
            # .with_entities(cu.paras, cu.clean, cu.vectors)\
            if not c_profile:
                c_profile = cu(user_id=id)
                sess.add(c_profile)
            c_profile.paras, c_profile.clean, c_profile.vectors = \
                self._prep_entry_cache(profile_txt)

        sess.commit()
        sess.close()


nlp_ = NLP()
