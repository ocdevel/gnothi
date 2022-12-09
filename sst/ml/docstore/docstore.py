import os
from typing import List, Dict, Optional
from haystack.document_stores import WeaviateDocumentStore
from docstore.nodes import nodes, embedding_dim, similarity
import weaviate

INIT_WEAVIATE = os.getenv('INIT_WEAVIATE', False)

weaviate_host = os.getenv(
    "weaviate_host",
    "http://localhost",
    # "http://legio-weavi-11TMR2G3K51SQ-0cfa2a12c9f80dbd.elb.us-east-1.amazonaws.com"
)


common_config = {
    "invertedIndexConfig": {"cleanupIntervalSeconds": 60},
    "vectorizer": "none",
    "vectorIndexConfig": {"distance": similarity},
}
props = {
    'orig_id': {
      "dataType": ["string"],
      "description": "The original object id. Will == weaviate's id most of the time, but some ids might not be UUIDs (eg books)",
      "name": "orig_id"
    },
    'parent_id': {
      "dataType": ["string"],
      "description": "UUID the owner (user, group, etc)",
      "name": "parent_id",
    },
    'name': {
      "dataType": ["string"],
      "description": "Name / title",
      "name": "name"
    },
    'content': {
      "dataType": ["text"],
      "description": "The body content",
      "name": "content"
    }
}
schema = {
    "classes": [
        {
            "class": "Paragraph",
            "description": "Individual paragraphs within entries",
            **common_config,

            # Note: orig_id==entry.id (same as its parent below)
            "properties": [
                props['content'],
                props['orig_id']
            ]
        },
        {
            "class": "Entry",  # Capital first letter
            "description": "User entries",
            **common_config,
            "moduleConfig": {
                "ref2vec-centroid": {
                  "referenceProperties": ["paragraphs"],
                  "method": "mean"
                }
              },
            "vectorizer": "ref2vec-centroid",
            "properties": [
                props['orig_id'],
                {
                    "dataType": ["string"],
                    "description": "Title generated by summarizer (external), or if user provided hard title",
                    "name": "title"
                },
                {
                    "dataType": ["string"],
                    "description": "Body summary generated by summarizer (external)",
                    "name": "summary"
                },
                {
                    "dataType": ["Paragraph"],
                    "description": "Sub-paras of entry. Used so full entry can be embedded, as mean of paras",
                    "name": "paragraphs"
                }
            ]
        },
        {
            "class": "User",
            "description": "A user is the mean of their entries. Might later cluster user into centroids and mean, so we can match-make topically",
            **common_config,
            "moduleConfig": {
                "ref2vec-centroid": {
                    "referenceProperties": ["entries"],
                    "method": "mean"
                }
            },
            "vectorizer": "ref2vec-centroid",
            "properties": [
                props['orig_id'],
                {
                    "dataType": ["Entry"],
                    "description": "Entries owned by this user",
                    "name": "entries"
                }
            ]
        },
        {
            "class": "Group",
            "description": "A group is the mean of its users. You match with a group if you you match with its members on average",
            **common_config,
            "moduleConfig": {
                "ref2vec-centroid": {
                    "referenceProperties": ["users"],
                    "method": "mean"
                }
            },
            "vectorizer": "ref2vec-centroid",
            "properties": [
                props['orig_id'],
                props['name'],
                props['content'],
                {
                    "dataType": ["User"],
                    "description": "Users in this group",
                    "name": "users"
                }
            ]
        },
        {
            **common_config,
            "class": "Book",  # <= note the capital "O".
            "description": "Book blurbs",
            "properties": [
                props['orig_id'],
                props['name'],
                props['content'],
                {
                    "dataType": ["string"],
                    "name": "author"
                },
                {
                    "dataType": ["string"],
                    "name": "genre"
                }
            ]
        }
    ]
}
classes = {c['class']: c for c in schema['classes']}


class Store(object):
    def __init__(self):
        if INIT_WEAVIATE:
            # Haystack has a bug if schema changes, must delete first manually
            client = weaviate.client.Client(url=f"{weaviate_host}:8080")
            client.schema.delete_all()
        self.document_store = WeaviateDocumentStore(
            host=weaviate_host,
            index="Entry",
            auto_create_schema=False,
            recreate_index=False,
            embedding_dim=embedding_dim,
            content_field="content",
            name_field="name",
            similarity="dot_product" if similarity == "dot" else similarity,
            return_embedding=True,
            embedding_field="embedding",
            custom_schema=schema
        )

        self.weaviate_client = self.document_store.weaviate_client

    def init_schema(self):
        # ensure in right order for child-referencing
        for c in ["Paragraph", "Entry", "User", "Group"]:
            self.weaviate_client.schema.delete_class(c)
            self.weaviate_client.schema.create_class(classes[c])



store = Store()



