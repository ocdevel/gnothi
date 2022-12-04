from sentence_transformers import SentenceTransformer
from keybert import KeyBERT
from typing import List, Optional, Dict

# https://docs.haystack.deepset.ai/docs/custom_nodes

# See https://github.com/MaartenGr/KeyBERT#23-max-sum-distance
def main(docs: List[Dict], params: Dict):
    doc = ' '.join([d['content'] for d in docs])
    sentence_model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
    model = KeyBERT(model=sentence_model)
    results = model.extract_keywords(
        doc,
        keyphrase_ngram_range=(1, 3),
        stop_words="english",

        use_mmr=True, diversity=0.7,
        # use_maxsum=True, nr_candidates=20, top_n=5,

        # **params
    )

    results = [r[0] for r in results]
    return results
