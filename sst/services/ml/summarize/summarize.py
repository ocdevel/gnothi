import os
# I tried setting the first two as ENV in Dockerfile but no cigar.
# Now I'm just blasting all possibilities. Lambda is read-only outside /mnt and /tmp
for env_key in [
    'TRANSFORMERS_CACHE',
    'HF_MODULES_CACHE',
    'TORCH_HOME',
    'SENTENCE_TRANSFORMERS_HOME'
]:
    os.environ[env_key] = '/mnt/transformers_cache'

from typing import List, Optional, Dict, Tuple
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
from sentence_transformers import SentenceTransformer
from keybert import KeyBERT
from pprint import pprint
# model_name = "/var/task/model"


class Summarize(object):
    def __init__(self):
        name_or_path = "ccdv/lsg-bart-base-4096-wcep"
        tokenizer = AutoTokenizer.from_pretrained(name_or_path, trust_remote_code=True)
        model = AutoModelForSeq2SeqLM.from_pretrained(name_or_path, trust_remote_code=True)
        self.model = pipeline("summarization", model=model, tokenizer=tokenizer)

    def predict(self, text, params):
        """
        FIXME
        The model 'LSGBartForConditionalGeneration' is not supported for summarization. Supported models are ['BartForConditionalGeneration', 'BigBirdPegasusForConditionalGeneration', 'BlenderbotForConditionalGeneration', 'BlenderbotSmallForConditionalGeneration', 'EncoderDecoderModel', 'FSMTForConditionalGeneration', 'LEDForConditionalGeneration', 'LongT5ForConditionalGeneration', 'M2M100ForConditionalGeneration', 'MarianMTModel', 'MBartForConditionalGeneration', 'MT5ForConditionalGeneration', 'MvpForConditionalGeneration', 'PegasusForConditionalGeneration', 'PegasusXForConditionalGeneration', 'PLBartForConditionalGeneration', 'ProphetNetForConditionalGeneration', 'SwitchTransformersForConditionalGeneration', 'T5ForConditionalGeneration', 'XLMProphetNetForConditionalGeneration'].
        /home/lefnire/.local/lib/python3.10/site-packages/transformers/generation/beam_search.py:198: UserWarning: Passing `max_length` to BeamSearchScorer is deprecated and has no effect. `max_length` should be passed directly to `beam_search(...)`, `beam_sample(...)`, or `group_beam_search(...)`.
        """

        params_ = params.get('summarize', {})
        if not params_:
            return ""
        return self.model(
            text,
            no_repeat_ngram_size=2,
            num_beams=6,
            num_beam_groups=3,
            diversity_penalty=2.0,
            # 'temperature': 1.5,
            truncation=True,
            repetition_penalty=1.0,
            early_stopping=True,
            **params_
        )[0]['summary_text']


class Keywords(object):
    def __init__(self):
        # https://docs.haystack.deepset.ai/docs/custom_nodes
        # See https://github.com/MaartenGr/KeyBERT#23-max-sum-distance
        name_or_path = "all-MiniLM-L6-v2"
        embedder = SentenceTransformer(name_or_path, device="cpu")
        self.model = KeyBERT(model=embedder)

    def predict(self, text, params):
        params_ = params.get('keywords', {})
        if not params_:
            return []
        res = self.model.extract_keywords(
            text,
            keyphrase_ngram_range=(1, 3),
            stop_words="english",

            # Use one of these option-combos
            use_mmr=True, diversity=0.7,
            # use_maxsum=True, nr_candidates=20, top_n=5,

            # TODO passing {'top_n': 5} errors about arg top_n?
            # **params_
        )
        # [ ["cognitive behavioral therapy", .9], ["cbt", .8], ..]
        return [r[0] for r in res]


class Emotion(object):
    def __init__(self):
        self.model = pipeline(
            "text-classification",
            model="j-hartmann/emotion-english-distilroberta-base",
            # top_k=None  # returns all scores
            top_k=1
        )

    def predict(self, text, params):
        if not params.get('emotion', None):
            return ""
        res = self.model(text, truncation=True)
        return res[0][0]['label']


summarize = Summarize()
keywords = Keywords()
emotion = Emotion()


def main(event, context):
    """
    :param event: [{
        text: str,
        params: {
            keywords?: {top_n: int},
            emotion?: bool
            summary?: {min_length: int, max_length: int}
        }
    }]
    :param context: None
    :return: [{
        emotion: str
        keywords: str[]
        summary: str
    }]
    """
    results = []
    for doc in event:
        text, params = doc['text'], doc['params']
        results.append({
            'summary': summarize.predict(text, params),
            'keywords': keywords.predict(text, params),
            'emotion': emotion.predict(text, params)
        })

    return results