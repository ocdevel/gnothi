from common.env import VECTORS_PATH
from common.util import fix_np
from sentence_transformers.util import semantic_search
import pyarrow.feather as feather
import os
import logging
import boto3

dir_ = f"{VECTORS_PATH}/books"
file = f"{dir_}/embeddings.feather"

if not os.path.exists(file):
    os.makedirs(dir_, exist_ok=True)
    s3 = boto3.client('s3')
    s3_path = 'vectors/books/embeddings.feather'
    logging.warning("{} doesn't exist. Downloading from {}/{}".format(
        file,
        os.getenv("bucket_name"),
        s3_path
    ))
    s3.download_file(
        os.getenv("bucket_name"),
        s3_path,
        file
    )
df = feather.read_feather(file)

def main(event, context):
    embedding = fix_np(event['embedding'])
    results = semantic_search(
        query_embeddings=embedding,
        corpus_embeddings=fix_np(df.embedding.values),
        top_k=50,
        corpus_chunk_size=100
    )
    idx_order = [r['corpus_id'] for r in results[0]]
    ordered = df.iloc[idx_order].drop(columns=['embedding'])
    return ordered.to_dict("records")
