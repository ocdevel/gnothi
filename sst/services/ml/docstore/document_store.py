from haystack.document_stores import WeaviateDocumentStore
from haystack import Document
import weaviate
from typing import Optional, List, Union, Dict


class CustomDocumentStore(WeaviateDocumentStore):
    def __init__(self):
        super().__init__(
            index="Object",
            embedding_dim=384,
            content_field="content",
            name_field="name",
            similarity="cosine",
            return_embedding=False,
            embedding_field="embedding",
            recreate_index=False
        )

    def upsert(self, docs: List[Dict], index: str = "Object"):
        for doc in docs:
            self.weaviate_client.data_object.create(
                doc,
                index,
                uuid=doc['obj_id']
            )

    def init_data_haystack(self, docs):
        from haystack.nodes import EmbeddingRetriever

        document_store = self.document_store
        retriever = EmbeddingRetriever(
            document_store=self.document_store,
            embedding_model="sentence-transformers/multi-qa-mpnet-base-dot-v1",
            model_format="sentence_transformers",
        )
        document_store.write_documents(docs)
        document_store.update_embeddings(retriever)
