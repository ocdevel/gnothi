from common.env import VECTORS_PATH
import os, json
import numpy as np
from typing import List, Dict, Optional
import boto3
from docstore.nodes import nodes
from common.preprocess import CleanText
from uuid import uuid4
import pandas as pd
import pyarrow as pa
from pyarrow import parquet
from box import Box

region = os.getenv("REGION", "us-east-1")
summarize_fn = os.getenv(
    "summarize_fn",
    "arn:aws:lambda:us-east-1:488941609888:function:legionwin3-gnothi-Ml-fnsummarize13BA0EC4-Ocv0FCykjbi7"
)
lambda_client = boto3.client("lambda", region_name=region)

def summarize(text: str):
    Payload = [
        {
            "text": text,
            "params": {"summarize": {"min_length": 20, "max_length": 80}}
        }, 
        {
            "text": text,
            "params": {
                "summarize": {"min_length": 100, "max_length": 300},
                "keywords": {"top_n": 5},
                "emotion": True
            }
        }
    ]
    response = lambda_client.invoke(
        FunctionName=summarize_fn,
        InvocationType='RequestResponse',
        Payload=bytes(json.dumps(Payload), encoding='utf-8')
    )
    return json.loads(response['Payload'].read())


def add_entry(entry):
    eid, text, uid, created_at = (
        entry['id'],
        entry['text'],
        entry['user_id'],
        entry['created_at']
    )

    # We'll be storing vectors on EFS
    # TODO check against vectors_version (as we update schema)
    user_dir = f"{VECTORS_PATH}/{uid}"
    os.makedirs(user_dir, exist_ok=True)
    all_file = f"{user_dir}/entries.parquet"

    # manually encode here because WeaviateDocumentStore will write document with np.rand,
    # then you re-fetch the document and update_embeddings()
    retriever = nodes.dense_retriever(batch_size=8)
    embed = retriever.embedding_encoder.embed

    # Convert text into paragraphs
    print("Cleaning entry, converting to paragraphs")
    paras = CleanText([text]).markdown_split_paragraphs().value()
    if not paras:
        raise "No paragraphs, fix this! See entries_profiles.py"
    text = " ".join(paras)  # now clean of markdown, grouped cleanly

    # Summarize
    print("Summarizing entry")
    summaries = summarize(text)
    title = summaries[0]['summary']
    summary, keywords, emotion = summaries[1]['summary'], summaries[1]['keywords'], summaries[1]['emotion']

    # Embed
    print("Embedding entry")
    embeddings = embed(paras)

    # Aggregate
    paras = pd.DataFrame([
        dict(
            id=str(uuid4()),  # wouldn't be unique. We'll filter via orig_id
            obj_id=eid,
            obj_type='paragraph',
            content=p,
            created_at=created_at,  # used for sorting in analyze later
            embedding=embeddings[i]
        ) for i, p in enumerate(paras)
    ])
    entry_mean = np.mean(embeddings, axis=0)
    entry = pd.DataFrame([
        dict(
            id=eid,
            obj_id=eid,
            obj_type='entry',
            content=summary, # will use for future summarizing many summaries
            created_at=created_at,
            embedding=entry_mean
        )
    ])

    print("Saving paragraphs to vecdb")
    concats = [paras, entry]
    if os.path.exists(all_file):
        # TODO file-lock
        # remove original paras, entry, and user-mean; this is an upsert
        existing_df = parquet.read_table(
            f"{user_dir}/entries.parquet",
            filters=[("obj_id", "not in", {eid, uid})]
        ).to_pandas()
        concats.append(existing_df)
    # TODO handle bio, people
    new_df = pd.concat(concats)
    user_mean = new_df[new_df.obj_type == "paragraph"].embedding.mean(axis=0)
    new_df = pd.concat([
        new_df,
        pd.DataFrame([dict(
            id=uid,
            obj_id=uid,
            obj_type='user',
            content="",
            created_at=created_at,  # inaccurate, but we're not using this anywhere
            embedding=user_mean
        )]
    )])
    parquet.write_table(
        pa.Table.from_pandas(new_df),
        all_file,
    )
    # TODO file-unlock

    result = {
        'title': title,
        'summary': summary,
        'keywords': keywords,
        'emotion': emotion,
        'vector': user_mean
    }
    print("Done with result:", result)
    return result
