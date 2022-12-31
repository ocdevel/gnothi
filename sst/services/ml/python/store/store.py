"""
Utils for marshalling in / out of pandas
"""
import os
from typing import List, Dict, Optional
from common.env import VECTORS_PATH, ENCODER_MODEL
import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import pyarrow.feather as feather
from uuid import uuid4
import torch
import logging
from sentence_transformers.util import semantic_search
from sentence_transformers import SentenceTransformer

bucket_name = os.environ['bucket_name']
bucket_name = f"s3://{bucket_name}"
# region = os.environ['region']

encoder = SentenceTransformer(model_name_or_path=ENCODER_MODEL)


def embed(texts: List[str]):
    # manually encode here because WeaviateDocumentStore will write document with np.rand,
    # then you re-fetch the document and update_embeddings()
    return encoder.encode(texts)


# PyArrow + S3, partition read/write with filters
# https://arrow.apache.org/cookbook/py/io.html
# Partition:Write - https://arrow.apache.org/cookbook/py/io.html#writing-partitioned-datasets
# Partition:Read - https://arrow.apache.org/cookbook/py/io.html#reading-partitioned-data
ext = "parquet"

class EntryStore(object):
    def __init__(self, user_id):
        self.user_id = user_id

        # Each user has their own directory of dataframes for paragraphs, entries, etc
        my_dir = f"{bucket_name}/vectors/{user_id}"
        self.dir_entries = f"{my_dir}/entries"
        self.dir_paras = f"{my_dir}/paras"

        # Then there's the single user embedding which is used at a global level to match-make
        # to groups, each other, etc
        self.user_global = f"{bucket_name}/vectors/users/{user_id}.{ext}"

    def load(self, path, filters=None):
        return pq.read_table(path, filters=filters).to_pandas()

    def write_df(self, df, path):
        table = pa.Table.from_pandas(df)
        pq.write_table(table, path)

    def add_entry(self, entry: Dict):
        eid, paras, text = entry['id'], entry['text_paras'], entry['text_clean']
        print("Embedding paras")
        paras_embeddings = embed(paras)
        paras = pd.DataFrame([
            dict(
                id=str(uuid4()),  # wouldn't be unique. We'll filter via orig_id
                obj_id=eid,
                obj_type='paragraph',
                content=p,
                created_at=entry['created_at'],  # used for sorting in insights later
                embedding=paras_embeddings[i]
            ) for i, p in enumerate(paras)
        ])
        self.write_df(paras, f"{self.dir_paras}/{eid}.{ext}")

        entry_mean = np.mean(paras_embeddings, axis=0)
        # Will use for future summarizing many summaries. But they may have specified skip_summarize
        entry_content = entry.get("ai_text", entry['text_clean'])
        entry = pd.DataFrame([
            dict(
                id=entry['id'],
                obj_id=entry['id'],
                obj_type='entry',
                content=entry_content,
                created_at=entry['created_at'],
                embedding=entry_mean
            )
        ])
        self.write_df(entry, f"{self.dir_entries}/{eid}.{ext}")
        self.update_user_mean()

    def update_user_mean(self):
        mean = (pq
            .read_table(f"{self.dir_entries}") #, filters=[('x', '=', 'y')])
            .to_pandas()
            .embedding.mean(axis=0)
        )
        df = pd.DataFrame([dict(
            id=self.user_id,
            obj_id=self.user_id,
            obj_type='user',
            content="",
            created_at="",
            embedding=mean
        )])
        self.write_df(df, self.user_global)

