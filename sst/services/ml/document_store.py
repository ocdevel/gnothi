from haystack.document_stores import WeaviateDocumentStore
import weaviate

connection_string = "http://localhost:8080"
document_store_ = None

def get_document_store(recreate_index=False):
    global document_store_
    if document_store_:
        return document_store_
    if recreate_index:
        client = weaviate.Client(connection_string)
        client.schema.delete_all()
    document_store_ = WeaviateDocumentStore(
        recreate_index=recreate_index,
        content_field="content",
        # similarity="dot_product",
        name_field="obj_id",
        return_embedding=True,
        index="Object",
        custom_schema={
            "classes": [{
                "class": "Object",  # <= note the capital "A".
                "description": "Individual entry embeddings",
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
    )
    return document_store_


def init_data(document_store: WeaviateDocumentStore, retriever):
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

    docs = docs[:50]

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

    # Now, let's write the dicts containing documents to our DB.
    document_store.write_documents(docs)
    document_store.update_embeddings(retriever)
