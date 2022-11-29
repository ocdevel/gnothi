import json, time

import logging

logging.basicConfig(format="%(levelname)s - %(name)s -  %(message)s", level=logging.WARNING)
logging.getLogger("haystack").setLevel(logging.INFO)

from haystack.document_stores import FAISSDocumentStore
from haystack.nodes import BM25Retriever, DensePassageRetriever, FilterRetriever, TransformersReader, EmbeddingRetriever
from haystack.nodes import FARMReader
from haystack.pipelines import ExtractiveQAPipeline
from haystack.utils import print_answers

SETUP = False

index_path = './faiss_index'
config_path = './faiss_index.json'

document_store = FAISSDocumentStore() if SETUP else FAISSDocumentStore.load(index_path, config_path)
retriever = EmbeddingRetriever(
    document_store=document_store,
    embedding_model="sentence-transformers/multi-qa-mpnet-base-dot-v1",
    model_format="sentence_transformers",
)

if SETUP:
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
    document_store.save(index_path)
    a = 1

def main(event, context):
    reader = FARMReader(model_name_or_path="deepset/roberta-base-squad2", use_gpu=False)
    retriever = DensePassageRetriever(document_store=document_store, use_gpu=False)
    pipe = ExtractiveQAPipeline(reader, retriever)
    prediction = pipe.run(
        query="Who is the father of Arya Stark?", params={"Retriever": {"top_k": 10}, "Reader": {"top_k": 5}}
    )
    # Change `minimum` to `medium` or `all` to raise the level of detail
    print_answers(prediction, details="all")
    return None
