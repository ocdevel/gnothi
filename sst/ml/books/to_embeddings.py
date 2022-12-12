import os
# Use GPU for this
os.environ["CUDA_VISIBLE_DEVICES"] = "0"
from common.env import VECTORS_PATH
import pandas as pd
import re, pickle
from docstore.nodes import nodes, embedding_dim
import pyarrow.feather as feather

books_dir = f"{VECTORS_PATH}/books"
books_file = f"{books_dir}/meta.feather"
embeddings_file = f"{books_dir}/embeddings.feather"
os.makedirs(books_dir, exist_ok=True)

batch_size = 400 if embedding_dim == 384 else 100
retriever = nodes.dense_retriever(batch_size=batch_size)
embed = retriever.embedding_encoder.embed

def embed_and_save(df):
    embeddings = embed(df.content.tolist())
    # emb_col =pd.DataFrame({'embeddings': embeddings})
    # books = pd.concat([books, emb_col], axis=1)
    df = pd.DataFrame([
        {**b, 'embedding': embeddings[i]}
        for i, b in enumerate(df.to_dict("records"))
    ])
    feather.write_feather(df, embeddings_file)

meta = feather.read_feather(books_file)

# Smoke-test a few before we go ham
embed_and_save(meta.iloc[:5])
# Then embed them all. This will take a couple hours
embed_and_save(meta)

