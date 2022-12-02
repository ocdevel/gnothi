from haystack.document_stores import WeaviateDocumentStore
import weaviate
from typing import Optional, List, Union, Dict

custom_schema = {
    "classes": [{
        "class": "Object",  # <= note the capital "A".
        "description": "Individual entry embeddings",
        "vectorIndexConfig": {
            "distance": "dot"
        },
        "properties": [
            {
                "dataType": [
                    "string"
                ],
                "description": "UUID the owner (user, group, etc)",
                "name": "parent_id",
            },
            {
                "dataType": [
                    "string"
                ],
                "description": "UUID of the object",
                "name": "obj_id",
            },
            {
                "dataType": [
                    "string"
                ],
                "description": "The object type. Eg, entry|user_centroid|user_center|group_centroid|group_center",
                "name": "obj_type"
            },
            {
                "dataType": [
                    "text"
                ],
                "description": "The body content",
                "name": "content"
            }
            # TODO consider adding user-manual title/summary
        ]
    }]
    # , {
    #     "class": "Book",
    #     "description": "Book embeddings",
    #     "properties": [
    #         {
    #             "dataType": [
    #                 "string"
    #             ],
    #             "description": "Some universal id on book",
    #             "name": "obj_id",
    #         },
    #         {
    #             "dataType": [
    #                 "text"
    #             ],
    #             "description": "The body content",
    #             "name": "text"
    #         }
    #         # TODO consider adding user-manual title/summary
    #     ]
    # }]
}

class CustomDocumentStore(object):
    def __init__(
        self,
        raw_weaviate: bool = True,
        recreate_index: bool = False,
    ):
        client = weaviate.Client("http://localhost:8080")

        if recreate_index:
            client.schema.delete_all()
        if raw_weaviate:
            self.document_store = None
            self.client = client
            if recreate_index:
                for class_obj in custom_schema['classes']:
                    client.schema.create_class(class_obj)
        else:
            self.document_store = WeaviateDocumentStore(
                index="Object",
                embedding_dim=384,
                content_field="content",
                name_field="obj_id",
                similarity="cosine",
                custom_schema=custom_schema,
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

    def _mock_data(self):
        from haystack.utils import clean_wiki_text, convert_files_to_docs, fetch_archive_from_http

        # Let's first fetch some documents that we want to query
        # Here: 517 Wikipedia articles for Game of Thrones
        doc_dir = "data/tutorial1"
        s3_url = "https://s3.eu-central-1.amazonaws.com/deepset.ai-farm-qa/datasets/documents/wiki_gameofthrones_txt1.zip"
        fetch_archive_from_http(url=s3_url, output_dir=doc_dir)

        # Convert files to dicts
        # You can optionally supply a cleaning function that is applied to each doc (e.g. to remove footers)
        # It must take a str as input, and return a str.
        docs = convert_files_to_docs(dir_path=doc_dir, clean_func=clean_wiki_text, split_paragraphs=True)

        # We now have a list of dictionaries that we can write to our document store.
        # If your texts come from a different source (e.g. a DB), you can of course skip convert_files_to_dicts() and create the dictionaries yourself.
        # The default format here is:
        # {
        #    'content': "<DOCUMENT_TEXT_HERE>",
        #    'meta': {'name': "<DOCUMENT_NAME_HERE>", ...}
        # }
        # (Optionally: you can also add more key-value-pairs here, that will be indexed as fields in Elasticsearch and
        # can be accessed later for filtering or shown in the responses of the Pipeline)

        # Let's have a look at the first 3 entries:
        print(docs[:3])
        return docs[:50]

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
