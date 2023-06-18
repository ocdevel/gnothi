from common.env import USE_GPU

from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
import re

# this comes from how tisuth training
led8k = {'revision': "f5f212b", "max_tokens": 8192}
led4k = {'revision': "5ce62a4", "max_tokens": 4096}
led12k = {'revision': "0c6a38c", "max_tokens": 12032}
m = led12k

model_name = "lefnire/tisuth"
model = AutoModelForSeq2SeqLM.from_pretrained(model_name, revision=m['revision'])#, trust_remote_code=True)
model.config.use_cache = True
tokenizer = AutoTokenizer.from_pretrained(
    model_name,
    revision=m['revision'],
    #trust_remote_code=True,
    # max_input_length=m['max_tokens'],
    # truncation=True,
    # padding="max_length"
)
pipe = pipeline("text2text-generation", model=model, tokenizer=tokenizer)

# model = pipeline(
#     "summarization",
#     model=model,
#     tokenizer=tokenizer,
#     # no_repeat_ngram_size=2,
#     truncation=True,
#     # repetition_penalty=1.0,
#     # early_stopping=True,
#     # # num_beams=4,
#     #
#     # # When trying num_beam_groups I get: Passing `max_length` to BeamSearchScorer is deprecated and has no effect. `max_length` should be passed directly to `beam_search(...)`, `beam_sample(...)`, or `group_beam_search(...)`.
#     # num_beams=6,
#     # num_beam_groups=3,
#     # diversity_penalty=2.0,
#     # # temperature=1.5,
# )


def main(event, context):
    output = pipe(event['texts'], truncation=True, use_cache=True, repetition_penalty=2.0)
    return {
        'data': output
    }
