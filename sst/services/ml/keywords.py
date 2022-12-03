from sentence_transformers import SentenceTransformer
from keybert import KeyBERT
from typing import List, Optional, Dict

# https://docs.haystack.deepset.ai/docs/custom_nodes

# See https://github.com/MaartenGr/KeyBERT#23-max-sum-distance
def main(docs: List[str], params: Dict):
    doc = ' '.join(docs)
    sentence_model = SentenceTransformer("all-MiniLM-L6-v2")
    model = KeyBERT(model=sentence_model)
    results = model.extract_keywords(
        doc,
        keyphrase_ngram_range=(1, 3),
        stop_words="english",
        use_mmr=True,
        diversity=0.7,
        **params
    )

    results = [r[0] for r in results]
    return results
