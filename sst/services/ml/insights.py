import weaviate
import json
from sentence_transformers import SentenceTransformer
from keybert import KeyBERT

# client = weaviate.Client("https://some-endpoint.semi.network/") # <== if you use the WCS
client = weaviate.Client("http://localhost:8080") # <== if you use Docker-compose


# See https://github.com/MaartenGr/KeyBERT#23-max-sum-distance
def themes(doc):
    sentence_model = SentenceTransformer("all-MiniLM-L6-v2")
    kw_model = KeyBERT(model=sentence_model)
    kw_model.extract_keywords(doc, keyphrase_ngram_range=(1, 3), stop_words="english",
        use_mmr=True, diversity=0.7)

def main(event, context):
    # _additional {vector}

    result = (client.query
        .get("Object", ["text", 'obj_id'])
        .with_where(dict(
            path=["obj_id"],
            operator="Equal",
            valueString="entry-1"
        ))
        .with_additional(["vector"])
        .do()
    )
    result = result['data']['Get']['Object']
    # result[0]['_additional']['vector']
    # result[0]['text']

    print(result[0])

    return {
        "summary": result, # ['data']['Get']['Object'][0]['_additional']['summary'][0],
        "themes": ["theme1", "theme2", "theme3"],
        "answers": ["answer1", "answer2", "answer3"]
    }

