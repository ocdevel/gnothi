import math, time, pdb, re, gc
import torch
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification, AutoModelForSeq2SeqLM,\
    AutoModelForSeq2SeqLM, AutoModelForQuestionAnswering
from transformers import BartForConditionalGeneration, BartTokenizer
from transformers import LongformerTokenizer, LongformerForQuestionAnswering
from scipy.stats import mode as stats_mode
from typing import Union, List, Dict, Callable, Tuple
from common.utils import is_test

import logging
logger = logging.getLogger(__name__)

# temporary: how many tokens can the gpu handle at a time? determines how much
# to batch per model. Eg, QA only one part at a time; others multiple parts
max_gpu_tokens = 4096
# max_gpu_tokens = 4096//2
tokenizer_args = dict(truncation=True, padding=True, return_tensors='pt')

# Keep BERT models around for a while, so they're re-used if requested back-to-back. Experiment with settings False
# around the GPU-killing issue https://github.com/lefnire/gnothi/issues/10
CACHE_MODELS = True

class NLP():
    def __init__(self):
        self.m = {}

    def load(self, k):
        if CACHE_MODELS:
            while self.m.get(k, None) == -1:
                time.sleep(1)  # loading, wit till ready
            if self.m.get(k, None) is not None:
                return self.m[k]  # it's already loaded
            self.m[k] = -1  # tell others it's loading, wait
        m = None
        logger.info(f"Load {k}")
        if k == 'sentence-encode':
            m = SentenceTransformer('roberta-base-nli-stsb-mean-tokens')
        elif k == 'sentiment-analysis':
            tokenizer = AutoTokenizer.from_pretrained("mrm8488/t5-base-finetuned-emotion")
            model = AutoModelForSeq2SeqLM.from_pretrained("mrm8488/t5-base-finetuned-emotion").to("cuda")
            model.eval()
            # TODO we sure it's not ForSequenceClassification? https://huggingface.co/mrm8488/t5-base-finetuned-emotion
            m = (tokenizer, model, 512)
        elif k == 'summarization':
            # Not using pipelines because can't handle >max_tokens
            # https://github.com/huggingface/transformers/issues/4501
            # https://github.com/huggingface/transformers/issues/4224
            max_tokens = 1024  # 4096
            tokenizer = BartTokenizer.from_pretrained('facebook/bart-large-cnn')
            model = BartForConditionalGeneration.from_pretrained('facebook/bart-large-cnn').to("cuda")
            model.eval()
            # model = EncoderDecoderModel.from_pretrained("patrickvonplaten/longformer2roberta-cnn_dailymail-fp16").to("cuda")
            # tokenizer = AutoTokenizer.from_pretrained("allenai/longformer-base-4096")
            m = (tokenizer, model, max_tokens)
        elif k == 'question-answering':
            tokenizer = LongformerTokenizer.from_pretrained("allenai/longformer-large-4096-finetuned-triviaqa")
            model = LongformerForQuestionAnswering.from_pretrained("allenai/longformer-large-4096-finetuned-triviaqa", return_dict=True).to("cuda")
            model.eval()
            # tokenizer = AutoTokenizer.from_pretrained("mrm8488/longformer-base-4096-finetuned-squadv2")
            # model = AutoModelForQuestionAnswering.from_pretrained("mrm8488/longformer-base-4096-finetuned-squadv2", return_dict=True).to("cuda")
            m = (tokenizer, model, 4096)
        if CACHE_MODELS:
            self.m[k] = m
        return m

    def clear(self):
        if not self.m: return
        print("Clearing GPU RAM")
        self.m = {}
        gc.collect()
        # K.clear_session()
        torch.cuda.empty_cache()

    def sentence_encode(self, x):
        logger.info("Sentence-encode")
        m = self.load('sentence-encode')
        return m.encode(x, batch_size=16, show_progress_bar=True)

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

            batch_size = max(max_gpu_tokens // max_tokens, 1)
            flat = []
            for i in range(0, len(parts), batch_size):
                batch = parts[i:i + batch_size]
                with torch.no_grad():
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
        logger.info("Sentiment-analysis")
        return self.run_batch_model(
            self.load('sentiment-analysis'),
            paras,
            self.sentiment_analysis_call,
            self.sentiment_analysis_wrap
        )

    def sentiment_analysis_call(self, loaded, batch, n_parts=None):
        tokenizer, model, max_tokens = loaded
        inputs = tokenizer(
            batch, # [p + '</s>' for p in batch],  # getting </s> duplicate warning
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
        logger.info("Summarization")
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

    def question_answering(
        self,
        question: str,
        paras: List[str]
    ):
        logger.info("Question-answering")
        if not paras:
            return [{"answer": "Not enough entries to use this feature."}]

        # Unlike the other features, QA should only be called on a flat-list of paras
        # (type-checked in this method's signature)
        call_args = dict(question=question)
        res = self.run_batch_model(
            self.load('question-answering'),
            [paras],
            self.question_answering_call,
            self.question_answering_wrap,
            call_args=call_args,
        )[0]

        clean = []
        for a in res:
            # Remove duplicates
            if a['answer'] in [c['answer'] for c in clean]: continue
            # remove all "No answer" unless it's the only entry
            if a['answer'] == 'No answer' and len(clean): continue
            clean.append(a)
        return clean

    def question_answering_call(self, loaded, batch, question:str, n_parts=None):
        tokenizer, model, max_tokens = loaded
        batch_size = len(batch)  # TODO right?
        encoding = tokenizer(
            [question] * batch_size,
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
            answer = tokenizer.decode(
                tokenizer.convert_tokens_to_ids(answer_tokens))  # remove space prepending space token

            # TODO batch this up in question-answering post-process
            if len(answer) > 200:
                answer = self.summarization([answer], max_length=15, with_sentiment=False)
                answer = answer[0]["summary"]
            answer = answer if re.search("\S", answer) else "No answer"
            return [answer]

    def question_answering_wrap(self, val: List[str]):
        return [{"answer": a} for a in val]


nlp_ = NLP()
