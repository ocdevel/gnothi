from common.env import USE_GPU

from typing import List, Optional, Dict, Tuple
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
from sentence_transformers import SentenceTransformer
# from textsum.summarize import Summarizer
import re

# Remove some stuff that comes with the booksum models.
def replace_booksum(text):
    # Ultimately we want to preserve pronouns if used in journal entries. But summarization models tend
    # to insert pronouns where they didn't exist (very aggressively in fact), so this is a workaround
    def repl_pronoun(match):
        return 'They' if match.group(0).istitle() else 'they'
    text = re.sub(r'\b(?:[Ss]he|[Hh]e)\b', repl_pronoun, text)
    text = re.sub(r'\b(?:[Hh]er|[Hh]im)\b', 'them', text)
    text = re.sub(r'\b(?:[Hh]ers|[Hh]is)\b', 'theirs', text)

    text = re.sub(r'[Tt]he next day,? ', "", text)
    text = re.sub(r'[Tt]he ([Nn]arrator|[Aa]uthor) ', "", text)
    text = re.sub(r'[Ii]n this (section|lecture|chapter|paper|book),? ', "", text)
    return text


from keybert import KeyBERT
from pprint import pprint

class Summarize(object):
    def __init__(self):
        # I've tried the following models:
        # ccdv/lsg-bart-base-4096-wcep, ccdv/lsg-bart-base-16384, sshleifer/distilbart-xsum-12-6 | ccdv/lsg-bart-base-4096 | sshleifer/distill-pegasus-(cnn|xsum)-16-4
        # - pszemraj/long-t5-tglobal-base-16384-book-summary: hallucinates too much. The name and gender of the author;
        #     what the author does next, etc. Had an entry about a hard day at work, became "In this chapter, Victor the
        #     Narrator discusses his hard day at work. He goes to the store and buys a new car." - 90% was untrue.
        # We need something that doesn't sound like the data it was trained on. Namely news (CNN), Books (booksum), etc.
        # My thinking is that multi-datasource -trained models smooth out any one dataset's "vibe". If I use booksum
        # alone, things sound like "in this chapter, the author discusses ...". For now I'm just gonna roll with that,
        # but need to revisit
        # TODO try:
        # - pszemraj/textsum pip package
        # - google/pegasus-xsum

        # This seems to work a bit better tha LED-booksum, etc. All of them are relatively sensitive on the
        # min/max_length, so make sure the tokens passed in are >max

        model = "ccdv/lsg-bart-base-4096-wcep"
        self.tokenizer = AutoTokenizer.from_pretrained(model, trust_remote_code=True)
        model = AutoModelForSeq2SeqLM.from_pretrained(model, trust_remote_code=True)

        # textsum pip package has some conveniences, like token-windowing for long docs. But it can
        # be hard to work with for some of these custom hyperparameters, etc. Consider forking it
        # self.summarizer = Summarizer(
        self.pipe = pipeline(
            "summarization",
            model=model,
            tokenizer=self.tokenizer,
            no_repeat_ngram_size=2,
            truncation=True,
            repetition_penalty=1.0,
            early_stopping=True,
            # num_beams=4,

            # When trying num_beam_groups I get: Passing `max_length` to BeamSearchScorer is deprecated and has no effect. `max_length` should be passed directly to `beam_search(...)`, `beam_sample(...)`, or `group_beam_search(...)`.
            num_beams=6,
            num_beam_groups=3,
            diversity_penalty=2.0,
            # temperature=1.5,
        )


    def predict(self, text, params):
        params_ = params.get('summarize', {})
        if not params_:
            return ""

        tokens = self.tokenizer.tokenize(text)
        if len(tokens) <= params_['max_length']:
            return text

        return self.pipe(text, **params_)[0]['summary_text']


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
        params_ = {
            "keyphrase_ngram_range": (1, 1),
            "stop_words": "english",
            # Use one of these option-combos
            # use_mmr=True, diversity=0.7,
            # use_maxsum=True, nr_candidates=20,
            **params_,
        }
        params_["keyphrase_ngram_range"] = tuple(params_["keyphrase_ngram_range"])
        print("keywords:params", params_)
        res = self.model.extract_keywords(
            text,
            **params_
        )
        print("keywords:res", res)
        # [ ["cognitive behavioral therapy", .9], ["cbt", .8], ..]
        return [
            r[0] for r in res
            # if r[1] >= params_.get('min_score', .3)
        ]


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
