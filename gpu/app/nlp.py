import math, time, pdb, re
import torch
import numpy as np
from common.database import session
from common.fixtures import fixtures
import common.models as M
from sqlalchemy import text as satext
from app.cleantext import Clean
from sentence_transformers import SentenceTransformer
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification, AutoModelWithLMHead,\
    AutoModelForSeq2SeqLM, AutoModelForQuestionAnswering
from transformers import BartForConditionalGeneration, BartTokenizer
from transformers import LongformerTokenizer, LongformerForQuestionAnswering
from scipy.stats import mode as stats_mode
from typing import Union, List, Dict, Callable, Tuple

import logging
logger = logging.getLogger(__name__)

# temporary: how many tokens can the gpu handle at a time? determines how much
# to batch per model. Eg, QA only one part at a time; others multiple parts
max_gpu_tokens = 4096
# max_gpu_tokens = 4096//2
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

    @staticmethod
    def para_parts(paras, tokenizer, max_length):
        if not paras:
            paras = ["no text available"]  # TODO how/where to handle this properly?
            logger.warning("para_parts() got empty paras[]")
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
        print(part_tokens)
        return part_paras

    def run_batch_model(
        self,
        loaded: Tuple,
        paras: Union[List[str], List[List[str]]],
        call: Callable,
        wrap: Callable,
        call_args: Dict = {},
    ):
        if not paras:
            groups = [1]
            flat = [None]
        elif type(paras) == list and type(paras[0]) == str:
            paras = [paras]
        if paras:
            tokenizer, model, max_tokens = loaded
            parts = [self.para_parts(p, tokenizer, max_tokens) for p in paras]
            groups = [len(p) for p in parts]
            parts = [p for part in parts for p in part]

            # previously dividing min/max_length by n_parts. That gets diluted across multiple entries,
            # so taking simple median for now. TODO rethink
            n_parts = int(np.median(groups))

            batch_size = max_gpu_tokens // max_tokens
            flat = []
            for i in range(0, len(parts), batch_size):
                batch = parts[i:i + batch_size]
                flat += call(
                    loaded,
                    batch,
                    n_parts=n_parts,
                    **call_args
                )
        grouped = []
        for ct in groups:
            grouped.append(wrap(flat[:ct]))
            flat = flat[ct:]
        return grouped

    def sentiment_analysis(self, paras):
        return self.run_batch_model(
            self.load('sentiment-analysis'),
            paras,
            self.sentiment_analysis_call,
            self.sentiment_analysis_wrap
        )

    def sentiment_analysis_call(self, loaded, batch, n_parts=None):
        tokenizer, model, max_tokens = loaded
        inputs = tokenizer(
            [p + '</s>' for p in batch],
            max_length=max_tokens,
            **tokenizer_args
        )
        output = model.generate(inputs.input_ids.to("cuda"), max_length=2)
        return [tokenizer.decode(ids) for ids in output]

    def sentiment_analysis_wrap(self, val):
        if type(val) == list:
            val = stats_mode(val).mode[0]  # most common sentiment
        return {"label": val or "", "score": 1.}

    def summarization(
        self,
        paras: Union[List[str], List[List[str]]],
        min_length: int = None,
        max_length: int = None,
        with_sentiment: bool = True,
    ):
        call_args = dict(min_length=min_length, max_length=max_length)
        summs = self.run_batch_model(
            self.load('summarization'),
            paras,
            self.summarization_call,
            self.summarization_wrap,
            call_args=call_args,
        )

        sents = self.sentiment_analysis(paras) if with_sentiment else\
            [self.sentiment_analysis_wrap(None)] * len(summs)

        return [{**s, "sentiment": sents[i]["label"]} for (i, s) in enumerate(summs)]

    def summarization_call(self, loaded, batch, n_parts: int, min_length: int = None, max_length: int = None):
        min_ = max(min_length // n_parts, 2) if min_length else None
        max_ = max(max_length // n_parts, 10) if max_length else None

        tokenizer, model, max_tokens = loaded
        inputs = tokenizer(batch, max_length=max_tokens, **tokenizer_args)
        summary_ids = model.generate(
            inputs.input_ids.to("cuda"),
            min_length=min_,
            max_length=max_,

            # I think this is just for performance? PC hangs without it, not noticing output diff
            num_beams=4,
            early_stopping=True
        )
        return [
            tokenizer.decode(g, skip_special_tokens=True, clean_up_tokenization_spaces=False)
            for g in summary_ids]

    def summarization_wrap(self, val):
        if type(val) == list:
            val = "\n".join([v for v in val if v])
        val = val or None
        return {"summary": val, "sentiment": None}

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
                    answer = self.summarization([answer], max_length=15, with_sentiment=False)
                    answer = answer[0]["summary"]
                if answer and answer not in answers:
                    answers.append(answer)

        if not answers: return [{'answer': 'No answer'}]
        return [{'answer': a} for a in answers]

    def _prep_entry_cache(self, txt):
        paras = Clean.entries_to_paras([txt])
        clean = [' '.join(e) for e in Clean.lda_texts(paras, propn=True)]
        vecs = self.sentence_encode(paras).tolist()
        return paras, clean, vecs

    def entries(self):
        id = None  # remove id arg
        tokenizer, _, max_tokens = self.load('summarization')
        with session() as sess:
            entries = sess.query(M.Entry)\
                .filter(M.Entry.no_ai.isnot(True), M.Entry.ai_ran.isnot(True))\
                .all()
            if not entries: return {}

            paras_grouped = []
            uids = set()
            for e in entries:
                paras_grouped.append(Clean.entries_to_paras([e.text]))
                uids.add(e.user_id)
            paras_flat = [p for paras in paras_grouped for p in paras]


            fkeys = [e.title for e in entries]
            fixt = fixtures.load_nlp_entries(fkeys)
            if fixt:
                embeds, titles, texts, clean_txt = fixt
            else:
                embeds = self.sentence_encode(paras_flat).tolist()
                titles = self.summarization(paras_grouped, min_length=5, max_length=20, with_sentiment=False)
                texts = self.summarization(paras_grouped, min_length=30, max_length=250)
                clean_txt = Clean.lda_texts(paras_flat, propn=True)

            for i, e in enumerate(entries):
                c_entry = sess.query(M.CacheEntry).get(e.id)
                if not c_entry:
                    c_entry = M.CacheEntry(entry_id=e.id)
                    sess.add(c_entry)
                # Save the cache_entry (paras,clean,vectors)
                paras = paras_grouped[i]
                c_entry.paras = paras
                ct = len(paras)
                c_entry.clean = [' '.join(e) for e in clean_txt[:ct]]
                c_entry.vectors = embeds[:ct]
                sess.commit()

                # Save the fixture for later
                fixt = (embeds[:ct], titles[i], texts[i], clean_txt[:ct])
                fixtures.save_nlp_entry(e.title, fixt)

                embeds, clean_txt = embeds[ct:], clean_txt[ct:]

                e.title_summary = titles[i]["summary"]
                e.text_summary = texts[i]["summary"]
                e.sentiment = texts[i]["sentiment"]
                e.ai_ran = True
                sess.commit()

            # 9131155e: only update every x entries
            M.Job.multiple_book_jobs(list(uids))
        return {}


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
