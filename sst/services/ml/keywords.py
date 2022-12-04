# https://docs.haystack.deepset.ai/docs/custom_nodes
# See https://github.com/MaartenGr/KeyBERT#23-max-sum-distance

from sentence_transformers import SentenceTransformer
from keybert import KeyBERT
from typing import List, Optional, Dict, Tuple

sentence_model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
model = KeyBERT(model=sentence_model)


def main(event, context) -> List[List[Tuple[str, float]]]:
    # event: {text: string, params: Params}[]
    results = []
    for doc in event:
        text = doc['text']
        params = doc['params']
        res = model.extract_keywords(
            text,
            keyphrase_ngram_range=(1, 3),
            stop_words="english",

            # Use one of these option-combos
            use_mmr=True, diversity=0.7,
            # use_maxsum=True, nr_candidates=20, top_n=5,

            # TODO passing {'top_n': 5} errors about arg top_n?
            # **params
        )
        # [ ["cognitive behavioral therapy", .9], ["cbt", .8], ..]
        results.append(res)

    return results
