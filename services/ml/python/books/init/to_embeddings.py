import os
# Use GPU for this
os.environ["CUDA_VISIBLE_DEVICES"] = "0"
from common.env import VECTORS_PATH, ENCODER_DIM
from sentence_transformers import SentenceTransformer
import pandas as pd
import re, pickle
import pyarrow.feather as feather
model = SentenceTransformer("all-MiniLM-L6-v2")

books_dir = f"{VECTORS_PATH}/books"
books_file = f"{books_dir}/meta.feather"
embeddings_file = f"{books_dir}/embeddings.feather"
os.makedirs(books_dir, exist_ok=True)

batch_size = 400 if ENCODER_DIM == 384 else 100

def embed_and_save(df):
    embeddings = model.encode(df.content.tolist(), batch_size=batch_size)
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

