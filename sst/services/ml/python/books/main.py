from common.env import VECTORS_PATH
from common.util import fix_np
from sentence_transformers.util import semantic_search
import pyarrow.feather as feather
import os
import logging
import boto3

dir_ = f"{VECTORS_PATH}/books"
file = f"{dir_}/embeddings.feather"
download_from = "gnothi-public"  # os.getenv("bucket_name")

# if os.path.isdir(file):
#     import shutil
#     shutil.rmtree(file)
if not os.path.exists(file):
    os.makedirs(dir_, exist_ok=True)
    s3 = boto3.client('s3')
    s3_path = 'vectors/books/embeddings.feather'
    logging.warning("{} doesn't exist. Downloading from {}/{}".format(
        file,
        download_from,
        s3_path
    ))
    s3.download_file(
        download_from,
        s3_path,
        file
    )
df = feather.read_feather(file).set_index('id', drop=False)

def main(event, context):
    embedding = fix_np(event['embedding'])
    thumbs = event['thumbs']
    for t in thumbs:
        bid, direction = t['id'], t['direction']
        if bid not in df.index:
            continue
        # get the liked/disliked book's embedding
        # multiply by the direction of the thumb, add a gradient step to the search embedding
        correction = df.loc[bid].embedding * direction * .1
        print("Books correction. Direction:", direction, "Book:", df.loc[bid]['name'])
        embedding = embedding + correction
    results = semantic_search(
        query_embeddings=embedding,
        corpus_embeddings=fix_np(df.embedding.values),
        top_k=15,
        corpus_chunk_size=100
    )
    idx_order = [r['corpus_id'] for r in results[0]]
    ordered = df.iloc[idx_order].drop(columns=['embedding'])
    return ordered.to_dict("records")
