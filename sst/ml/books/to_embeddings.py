import re, os, pickle
# Use GPU for this
os.environ["CUDA_VISIBLE_DEVICES"] = "0"
import pandas as pd
from docstore.nodes import nodes
from haystack import Document

retriever = nodes.dense_retriever(batch_size=96)
embed = retriever.embedding_encoder.embed

def embed_and_save(books):
    books = [Document.from_dict(b) for b in books]
    texts = [b.content for b in books]
    embeddings = embed(texts)
    for i, b in enumerate(books):
        b.embedding = embeddings[i]
    with open('books/db/embeddings.pkl', 'wb') as f:
        pickle.dump(books, f)

books = pd.read_pickle('books/db/df.pkl').to_dict("records")

# Smoke-test a few before we go ham
embed_and_save(books[:5])
# Then embed them all. This will take a couple hours
embed_and_save(books)

