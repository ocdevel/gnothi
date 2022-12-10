import re, os
# Use GPU for this
os.environ["CUDA_VISIBLE_DEVICES"] = "0"
# os.environ["weaviate_host"] = "http://legio-weavi-11TMR2G3K51SQ-0cfa2a12c9f80dbd.elb.us-east-1.amazonaws.com"
import pandas as pd
from docstore.docstore import store, classes, Store

try:
    store.weaviate_client.schema.delete_class("Book")
except: pass
store.weaviate_client.schema.create_class(classes["Book"])

books = pd.read_pickle('books/db/embeddings.pkl')
store = Store()
store.document_store.write_documents(books, index="Book", batch_size=100)
