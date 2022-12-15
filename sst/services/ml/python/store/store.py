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

encoder = SentenceTransformer(model_name_or_path=ENCODER_MODEL)


def embed(texts: List[str]):
    # manually encode here because WeaviateDocumentStore will write document with np.rand,
    # then you re-fetch the document and update_embeddings()
    return encoder.encode(texts)



class EntryStore(object):
    def __init__(self, user_id):
        self.user_id = user_id
        self.entry = None
        self.dfs = []

        # We'll be storing vectors on EFS
        # TODO check against vectors_version (as we update schema)
        self.dir = f"{VECTORS_PATH}/{user_id}"
        os.makedirs(self.dir, exist_ok=True)
        self.file = f"{self.dir}/entries.parquet"

    def load(self, filters: List):
        if not os.path.exists(self.file):
            logging.warning(f"{self.file} doesn't exist")
            return pd.DataFrame([])
        return pq.read_table(self.file, filters=filters).to_pandas()

    def add_entry(self, entry: Dict, paras: List[str]):
        self.entry = entry
        print("Embedding paras")
        paras_embeddings = embed(paras)
        paras = pd.DataFrame([
            dict(
                id=str(uuid4()),  # wouldn't be unique. We'll filter via orig_id
                obj_id=entry['id'],
                obj_type='paragraph',
                content=p,
                created_at=entry['created_at'],  # used for sorting in analyze later
                embedding=paras_embeddings[i]
            ) for i, p in enumerate(paras)
        ])
        self.dfs.append(paras)

        entry_mean = np.mean(paras_embeddings, axis=0)
        # Will use for future summarizing many summaries. But they may have specified skip_summarize
        entry_content = entry.get("summary", entry['text'])
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
        self.dfs.append(entry)
        return entry_mean

    def save(self):
        entry = self.entry
        if os.path.exists(self.file):
            # TODO file-lock
            # remove original paras, entry, and user-mean; this is an upsert
            df = self.load([("obj_id", "not in", {entry['id'], self.user_id})])
            self.dfs.append(df)
            # TODO handle bio, people
        new_df = pd.concat(self.dfs)
        user_mean = new_df[new_df.obj_type == "paragraph"].embedding.mean(axis=0)
        new_df = pd.concat([
            new_df,
            pd.DataFrame([dict(
                id=self.user_id,
                obj_id=self.user_id,
                obj_type='user',
                content="",
                created_at=entry['created_at'],  # inaccurate, but we're not using this anywhere
                embedding=user_mean
            )]
            )])
        pq.write_table(
            pa.Table.from_pandas(new_df),
            self.file,
        )
        # TODO file-unlock


