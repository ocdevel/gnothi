from typing import List, Optional, Set, Union, Dict
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline

model_name = "ccdv/lsg-bart-base-4096-wcep"
# model_name = "/var/task/model"  # from dockerfile buildstage
model_args = {
    'cache_dir': '/mnt/transformers_cache',
    'trust_remote_code': True
}
tokenizer = AutoTokenizer.from_pretrained(model_name, **model_args)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name, **model_args)
pipe = pipeline("summarization", model=model, tokenizer=tokenizer)


def main(event, context) -> str:
    # event: {text: string, params: {}][]
    results = []
    for doc in event:
        text = doc['text']
        params = doc['params']
        defaults = {
            'no_repeat_ngram_size': 2,

            # ensure quality
            'num_beams': 6,
            'num_beam_groups': 3,
            'diversity_penalty': 2.0,
            # 'temperature': 1.5,

            # required in case content is still too long for model
            'truncation': True,

            # The repetition penalty is meant to avoid sentences that repeat themselves without anything really interesting.
            'repetition_penalty': 1.0,

            # I think just used to speed things up (across beam-search)
            'early_stopping': True,
        }
        res = pipe(
            text,
            **defaults,
            **params
        )[0]['summary_text']
        results.append(res)
    return results
