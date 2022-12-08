import re, os
import pandas as pd

os.environ['WILL_EMBED'] = "1"
os.environ['WILL_SEARCH'] = ""
from document_store import store, classMap
from common import nodes


print(f"Save to weaviate")
df = pd.read_pickle('books/db/df.pkl')
store.document_store.delete_index("Book")
store.weaviate_client.schema.create_class(classMap['Book'])
store.document_store.write_documents(df.to_dict("records"), index="Book", batch_size=100)
store.document_store.update_embeddings(index="Book", retriever=nodes.embedding_retriever, batch_size=10)
