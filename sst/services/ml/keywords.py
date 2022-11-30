from sentence_transformers import SentenceTransformer
from keybert import KeyBERT

# https://docs.haystack.deepset.ai/docs/custom_nodes

# See https://github.com/MaartenGr/KeyBERT#23-max-sum-distance
def main(doc):
    sentence_model = SentenceTransformer("all-MiniLM-L6-v2")
    kw_model = KeyBERT(model=sentence_model)
    kw_model.extract_keywords(doc, keyphrase_ngram_range=(1, 3), stop_words="english",
        use_mmr=True, diversity=0.7)
