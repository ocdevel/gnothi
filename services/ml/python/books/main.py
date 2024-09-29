from common.env import VECTORS_PATH
from common.util import fix_np
from sentence_transformers.util import semantic_search
import pyarrow.feather as feather
import os
import numpy as np
import pandas as pd
import logging
import boto3

dir_ = f"{VECTORS_PATH}/books"
file = f"{dir_}/embeddings2.feather"
download_from = "gnothi-public"  # os.getenv("bucket_name")

# if os.path.isdir(file):
#     import shutil
#     shutil.rmtree(file)
if not os.path.exists(file):
    os.makedirs(dir_, exist_ok=True)
    s3 = boto3.client('s3')
    s3_path = 'vectors/books/embeddings2.feather'
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

    if event['thumbs']:
        lr = .01  # fiddle with this. And balance it against global thumbs.
        thumbs = pd.DataFrame(event['thumbs'])
        # Filter out the books that are not in the original df
        thumbs = thumbs[thumbs['id'].isin(df.index)]
        # Compute corrections
        corrections = thumbs.apply(lambda t: df.loc[t['id']].embedding * t['direction'] * lr, axis=1)
        # Sum corrections and add to original embedding
        total_correction = corrections.sum()
        embedding += total_correction

        # Filter out the books which they've shelved
        filtered = df.loc[~df.index.isin(thumbs['id'])]
    else:
        filtered = df

    results = semantic_search(
        query_embeddings=embedding,
        corpus_embeddings=fix_np(filtered.embedding.values),
        top_k=15,
        corpus_chunk_size=100
    )
    idx_order = [r['corpus_id'] for r in results[0]]
    ordered = filtered.iloc[idx_order].drop(columns=['embedding'])
    # the Gnothi DB schema has them named differently. Woops.
    ordered = ordered.rename(columns={
        'name': 'title',
        'content': 'text',
        'genre': 'topic'
    })

    # Apply the function to each ISBN in the DataFrame and assign to a new column
    df['amazon'] = df['isbn'].apply(lambda x: f'https://www.amazon.com/dp/{x}/?tag=ha0d2-20' if x else None)

    return ordered.to_dict("records")
