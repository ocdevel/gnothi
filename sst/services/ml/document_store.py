from haystack.document_stores import WeaviateDocumentStore
from haystack import Document
import weaviate
from typing import Optional, List, Union, Dict

class CustomDocumentStore(object):
    def __init__(
        self,
        raw_weaviate: bool = True,
        recreate_index: bool = False,
    ):
        client = weaviate.Client("http://localhost:8080")

        if raw_weaviate:
            self.document_store = None
            self.client = client
        else:
            self.document_store = WeaviateDocumentStore(
                index="Object",
                embedding_dim=384,
                content_field="content",
                name_field="obj_id",
                similarity="cosine",
                return_embedding=True,
                embedding_field="embedding",
                recreate_index=recreate_index
            )
            self.client = self.document_store.weaviate_client
        if recreate_index:
            if raw_weaviate:
                self.init_data_weaviate()
            else:
                self.init_data_haystack()

    def upsert(self, docs: List[Dict], params: Dict):
        for doc in docs:
            self.client.data_object.create(
                doc,
                "Object",
                uuid=doc['obj_id']
            )

    def _mock_data(self):
        import re
        import requests
        import urllib.request
        import time
        from bs4 import BeautifulSoup
        from urllib.request import urlopen

        objects = []
        articles = [
            ['cbt', "https://en.wikipedia.org/wiki/Cognitive_behavioral_therapy"],
            ['vr', "https://en.wikipedia.org/wiki/Virtual_reality"],
            ['ai', "https://en.wikipedia.org/wiki/Artificial_intelligence"]
        ]
        for [topic, url] in articles:
            html = urlopen(url)
            soup = BeautifulSoup(html, 'html.parser')
            paras = []
            for para in soup.find(id="mw-content-text").find_all('p'):
                para = para.get_text()
                para = para.replace('\n', ' ')
                if len(para) < 10:
                    continue
                # para = re.sub(r"\[[0-9]*\]", "", para)
                if len(paras) == 0:
                    paras.append(para)
                elif len(para) < 100:
                    paras[len(paras) - 1] += para
                else:
                    paras.append(para)
            for i, para in enumerate(paras):
                doc = Document(
                    content=para,
                    meta={'name': f"{topic} {i}"})
                objects.append(doc)

        return objects


    def init_data_weaviate(self):
        docs = self._mock_data()
        for doc in docs:
            doc = {
                'obj_id': doc.id,
                'name': doc.meta['name'],
                'content': doc.content
            }
            self.client.data_object.create(data_object=doc, class_name="Object")


    def init_data_haystack(self):
        from haystack.nodes import EmbeddingRetriever

        docs = self._mock_data()
        document_store = self.document_store
        retriever = EmbeddingRetriever(
            document_store=self.document_store,
            embedding_model="sentence-transformers/multi-qa-mpnet-base-dot-v1",
            model_format="sentence_transformers",
        )
        document_store.write_documents(docs)
        document_store.update_embeddings(retriever)
