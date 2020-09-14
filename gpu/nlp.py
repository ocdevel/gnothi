import math, time, pdb, re
import torch
import numpy as np
from common.database import session
import common.models as M
from sqlalchemy import text as satext
from cleantext import Clean
from sentence_transformers import SentenceTransformer
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification, AutoModelWithLMHead,\
    AutoModelForSeq2SeqLM, AutoModelForQuestionAnswering
from transformers import BartForConditionalGeneration, BartTokenizer
from transformers import LongformerTokenizer, LongformerForQuestionAnswering
from scipy.stats import mode as stats_mode

# temporary: how many tokens can the gpu handle at a time? determines how much
# to batch per model. Eg, QA only one part at a time; others multiple parts
max_gpu_tokens = 4096
tokenizer_args = dict(truncation=True, padding=True, return_tensors='pt')

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
            # TODO we sure it's not ForSequenceClassification? https://huggingface.co/mrm8488/t5-base-finetuned-emotion
            m = (tokenizer, model, 512)
        elif k == 'summarization':
            # Not using pipelines because can't handle >max_tokens
            # https://github.com/huggingface/transformers/issues/4501
            # https://github.com/huggingface/transformers/issues/4224
            max_tokens = 1024  # 4096
            tokenizer = BartTokenizer.from_pretrained('facebook/bart-large-cnn')
            model = BartForConditionalGeneration.from_pretrained('facebook/bart-large-cnn').to("cuda")
            # model = EncoderDecoderModel.from_pretrained("patrickvonplaten/longformer2roberta-cnn_dailymail-fp16").to("cuda")
            # tokenizer = AutoTokenizer.from_pretrained("allenai/longformer-base-4096")
            m = (tokenizer, model, max_tokens)
        elif k == 'question-answering':
            tokenizer = LongformerTokenizer.from_pretrained("allenai/longformer-large-4096-finetuned-triviaqa")
            model = LongformerForQuestionAnswering.from_pretrained("allenai/longformer-large-4096-finetuned-triviaqa", return_dict=True).to("cuda")
            # tokenizer = AutoTokenizer.from_pretrained("mrm8488/longformer-base-4096-finetuned-squadv2")
            # model = AutoModelForQuestionAnswering.from_pretrained("mrm8488/longformer-base-4096-finetuned-squadv2", return_dict=True).to("cuda")
            m = (tokenizer, model, 4096)
        self.m[k] = m
        return m

    def clear(self):
        if not self.m: return
        print("Clearing GPU RAM")
        self.m = {}
        # K.clear_session()
        torch.cuda.empty_cache()

    def sentence_encode(self, x):
        m = self.load('sentence-encode')
        return np.array(m.encode(x, batch_size=64, show_progress_bar=True))

    def para_parts(self, paras, tokenizer, max_length):
        n_tokens = tokenizer(paras)
        n_tokens = [len(p) for p in n_tokens.input_ids]
        part_paras, part_tokens = [paras[0]], [n_tokens[0]]
        for i, para in enumerate(paras):
            if i == 0: continue
            cur, build = n_tokens[i], part_tokens[-1]
            # 90% max length, some wiggle room for special tokens or something (always > max somehow)
            if build + cur >= (max_length * .8):
                part_paras.append(para)
                part_tokens.append(0)
            else:
                part_paras[-1] += '\n' + para
                part_tokens[-1] += cur
        return part_paras

    def sentiment_analysis(self, paras):
        if not paras:
            return {"label": "", "score": 1.}
        tokenizer, model, max_tokens = self.load('sentiment-analysis')

        parts = self.para_parts(paras, tokenizer, max_tokens)

        sents = []
        batch_size = max_gpu_tokens//max_tokens
        for i in range(0, len(parts), batch_size):
            batch = parts[i:i+batch_size]
            inputs = tokenizer(
                [p + '</s>' for p in batch],
                max_length=max_tokens,
                **tokenizer_args
            )
            output = model.generate(inputs.input_ids.to("cuda"), max_length=2)
            sents += [tokenizer.decode(ids) for ids in output]
        label = stats_mode(sents).mode[0]  # return most common sentiment
        return {"label": label, "score": 1.}

    def summarization(self, paras, min_length=None, max_length=None, with_sentiment=True):
        if not paras:
            return {"summary": None, "sentiment": None}
        # paras = [re.sub(r'\bI\b', 'Tyler', p) for p in paras]
        tokenizer, model, max_tokens = self.load('summarization')

        parts = self.para_parts(paras, tokenizer, max_tokens)
        min_ = max(min_length//len(parts), 2) if min_length else None
        max_ = max(max_length//len(parts), 10) if max_length else None

        summs = []
        batch_size = max_gpu_tokens//max_tokens
        for i in range(0, len(parts), batch_size):
            batch = parts[i:i+batch_size]
            inputs = tokenizer(batch, max_length=max_tokens, **tokenizer_args)
            summary_ids = model.generate(
                inputs.input_ids.to("cuda"),
                min_length=min_,
                max_length=max_,

                # I think this is just for performance? PC hangs without it, not noticing output diff
                num_beams=4,
                early_stopping=True
            )
            res = [
                tokenizer.decode(g, skip_special_tokens=True, clean_up_tokenization_spaces=False)
                for g in summary_ids]
            #res = [re.sub(r"(^\"|$\")", "", r) for r in res]  # there a model flag to not add quotes?
            summs += res
        summs = "\n".join(summs)

        sent = None
        if with_sentiment:
            sent = self.sentiment_analysis(paras)
            sent = sent['label']

        return {"summary": summs, "sentiment": sent}

    def question_answering(self, question, paras):
        if not paras:
            return [{'answer': "Not enough entries to use this feature."}]
        tokenizer, model, max_tokens = self.load('question-answering')

        parts = self.para_parts(paras, tokenizer, max_tokens)

        answers = []
        batch_size = max_gpu_tokens // max_tokens
        for i in range(0, len(parts), batch_size):
            batch = parts[i:i + batch_size]
            encoding = tokenizer(
                [question]*batch_size,
                batch,
                max_length=max_tokens,
                **tokenizer_args
            )
            input_ids = encoding["input_ids"].to("cuda")
            attention_mask = encoding["attention_mask"].to("cuda")

            with torch.no_grad():
                outputs = model(input_ids, attention_mask=attention_mask)
            for j, _ in enumerate(batch):
                start_logits = outputs.start_logits[j]
                end_logits = outputs.end_logits[j]
                all_tokens = tokenizer.convert_ids_to_tokens(input_ids[j].tolist())

                answer_tokens = all_tokens[torch.argmax(start_logits):torch.argmax(end_logits) + 1]
                answer = tokenizer.decode(tokenizer.convert_tokens_to_ids(answer_tokens))  # remove space prepending space token

                if len(answer) > 200:
                    answer = self.summarization([answer], max_length=15, with_sentiment=False)["summary"]
                if answer and answer not in answers:
                    answers.append(answer)

        if not answers: return [{'answer': 'No answer'}]
        return [{'answer': a} for a in answers]

    def _prep_entry_cache(self, txt):
        paras = Clean.entries_to_paras([txt])
        clean = [' '.join(e) for e in Clean.lda_texts(paras, propn=True)]
        vecs = self.sentence_encode(paras).tolist()
        return paras, clean, vecs

    def entry(self, id=None):
        with session() as sess:
            e = sess.query(M.Entry).filter(M.Entry.no_ai.isnot(True))
            e = e.filter(M.Entry.id == id) if id else\
                e.filter(M.Entry.ai_ran.isnot(True))  # look for other entries to cleanup
            e = e.first()
            if not e: return {}
            root_call = bool(id)
            id = e.id

            # Run clean-text & vectors for themes/books
            c_entry = sess.query(M.CacheEntry).get(id)
            if not c_entry:
                c_entry = M.CacheEntry(entry_id=id)
                sess.add(c_entry)
            c_entry.paras, c_entry.clean, c_entry.vectors = self._prep_entry_cache(e.text)
            sess.commit()

            # Run summaries
            try:
                res = self.summarization(c_entry.paras, 5, 20, with_sentiment=False)
                e.title_summary = res["summary"]
                res = self.summarization(c_entry.paras, 30, 250)
                e.text_summary = res["summary"]
                e.sentiment = res["sentiment"]
            except Exception as err:
                print(err)
            e.ai_ran = True
            sess.commit()

            # 9131155e: only update every x entries
            if root_call:
                sess.add(M.Job(
                    method='books',
                    data_in={'args': [str(e.user_id)]}
                ))

        # recurse to process any left-behind entries
        return self.entry()

    def profile(self, id):
        with session() as sess:
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


nlp_ = NLP()
