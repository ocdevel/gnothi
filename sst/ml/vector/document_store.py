import os
from haystack.document_stores import WeaviateDocumentStore
from haystack import Document
from common import nodes, embedding_dim, similarity, WILL_EMBED

INIT_WEAVIATE = os.getenv('INIT_WEAVIATE', False)

weaviate_host = "http://legio-weavi-11TMR2G3K51SQ-0cfa2a12c9f80dbd.elb.us-east-1.amazonaws.com"

old_props = [
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
      "description": "The object type. Eg, entry|user_centroid|user_center|group_centroid|group_center",
      "name": "obj_type"
    },
    # TODO consider adding user-manual title/summary
]
common_config = {
    "invertedIndexConfig": {"cleanupIntervalSeconds": 60},
    "vectorizer": "none",
    "vectorIndexConfig": {"distance": similarity},
}
common_props = [
    {
      "dataType": [
        "string"
      ],
      "description": "The original object id. Will == weaviate's id most of the time, but some ids might not be UUIDs (eg books)",
      "name": "orig_id"
    },
    {
      "dataType": [
        "string"
      ],
      "description": "Name / title",
      "name": "name"
    },
    {
      "dataType": [
        "text"
      ],
      "description": "The body content",
      "name": "content"
    }
]
classes = [
    {
        **common_config,
        "class": "Entry",  # Capital first letter
        "description": "User entries",
        "properties": common_props
    },
    # {
    #   "class": "Paragraph",  # Capital first letter
    #   "description": "Paragraphs within Entry. Used for extending beyond 384 tokens, use refCentroid",
    #   "properties": common_props
    # },
    {
        **common_config,
        "class": "Book",  # <= note the capital "O".
        "description": "Book blurbs",
        "properties": [
            *common_props,
            {
                "dataType": [
                    "string"
                ],
                "name": "author"
            },
            {
                "dataType": [
                    "string"
                ],
                "name": "genre"
            }
        ]
    }
]
classMap = {obj['class']: obj for obj in classes}


class Store(object):
    def __init__(self):
        self.document_store = WeaviateDocumentStore(
            host=weaviate_host,
            index="Entry",
            recreate_index=INIT_WEAVIATE,
            embedding_dim=embedding_dim,
            content_field="content",
            name_field="name",
            similarity="dot_product" if similarity == "dot" else similarity,
            return_embedding=False,
            embedding_field="embedding",
        )

        self.weaviate_client = self.document_store.weaviate_client

    def initialize(self):
        self.document_store._create_schema_and_index(recreate_index=True)

    def entries_to_haystack(self, entries):
        return [
            dict(
                name=entry['title'] or entry['text'][:50],
                content=entry['text'],
                id=entry['id']
            ) if entry.get('text', None) else entry
            for entry in entries
        ]

    def upsert_entries(self, entries):
        if not WILL_EMBED:
            raise "Lambda not initialized with WILL_EMBED=true"
        entries = self.entries_to_haystack(entries)
        self.document_store.write_documents(entries, index="Entry")
        self.document_store.update_embeddings(nodes.embedding_retriever)

    def upsert_books(self, books):
        if not WILL_EMBED:
            raise "Lambda not initialized with WILL_EMBED=true"
        books = self.entries_to_haystack(books)
        self.document_store.write_documents(books, index="Book")
        self.document_store.update_embeddings(nodes.embedding_retriever)
        

store = Store()



