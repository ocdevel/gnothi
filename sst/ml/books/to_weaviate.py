import re, os
# Use GPU for this
os.environ["CUDA_VISIBLE_DEVICES"] = "0"
import pandas as pd
from docstore.docstore import store, classes, Store
from docstore.nodes import nodes
from haystack import Document

retriever = nodes.embedding_retriever(batch_size=128)
embed = retriever.embedding_encoder.embed
# Smoke-test that GPU works first
embed(["Embed me please"])

class_ = classes["Book"]

store.weaviate_client.schema.delete_class("Book")
store.weaviate_client.schema.create_class(class_)

df = pd.read_pickle('books/db/df.pkl')
books = df.to_dict("records")
books = [Document.from_dict(b) for b in books]
texts = [b.content for b in books]
embeddings = embed(texts)
for i, b in enumerate(books):
    b.embedding = embeddings[i]
store = Store() # reconnect since we probably lost connection during embedding
store.document_store.write_documents(books, index="Book", batch_size=100)
