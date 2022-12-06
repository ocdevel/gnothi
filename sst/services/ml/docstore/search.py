USE_GPU = False

import json
import logging
logging.basicConfig(format="%(levelname)s - %(name)s -  %(message)s", level=logging.WARNING)
logging.getLogger("haystack").setLevel(logging.INFO)

from document_store import CustomDocumentStore

"""
1) Keywords vs. Questions/Statements (Default)
   model_name_or_path="shahrukhx01/bert-mini-finetune-question-detection"
   output_1 => question/statement
   output_2 => keyword query
   [Readme](https://ext-models-haystack.s3.eu-central-1.amazonaws.com/gradboost_query_classifier/readme.txt)
2) Questions vs. Statements
`model_name_or_path`="shahrukhx01/question-vs-statement-classifier"
 output_1 => question
 output_2 => statement
 [Readme](https://ext-models-haystack.s3.eu-central-1.amazonaws.com/gradboost_query_classifier_statements/readme.txt)
"""

# TODO do all 3: keywords (BM25), statement (dense), question (dense->FarmReader).
# For now I'm punting on BM25, so I'll use keyword vs question/statement, dense for everything,
# and disambiguate question via "?"
from haystack.nodes import TransformersQueryClassifier
query_classifier = TransformersQueryClassifier(use_gpu=False)
def get_query_type(query: str, run_response: str):
    if query.endswith('?'):
        return 'question'
    if run_response == 'output_2':
        return 'keyword'
    return 'statement'


document_store = CustomDocumentStore()

from haystack.nodes import BM25Retriever
bm25_retriever = BM25Retriever(document_store)

from haystack.nodes import DensePassageRetriever
dpr_retriever = DensePassageRetriever(
    document_store=document_store,
    # query_embedding_model="facebook/dpr-question_encoder-single-nq-base",
    # passage_embedding_model="facebook/dpr-ctx_encoder-single-nq-base"
)

from haystack.nodes import RAGenerator
rag_generator = RAGenerator(
    model_name_or_path="facebook/rag-sequence-nq",
    retriever=dpr_retriever,
    top_k=1,
    min_length=2
)

def main(event, context):
    """
    :param event: {
        query: str. If None, return
        ids: [str, ..str] | None. If None, all entries go
    }
    :param context:
    :return:
    """
    ids = event.get('ids', None)
    query = event.get('query', None)

    if not query:
        return {"ids": [], "answer": ""}

    query_type = query_classifier.run(query)  # => ({}, 'output_2')
    query_type = get_query_type(query, query_type[1])

    # TODO replace this with bm25/dpr combo
    build = (document_store.weaviate_client.query
        .get("Object", ["name", "content", "obj_id", "obj_type", "parent_id"])
        .with_additional(["id"])
        .with_near_text({
            'concepts': [query],
            'certainty': .2
        })
    )
    if ids:
        build = build.with_where({
            "operator": "Or",
            "operands": [
                {"path": ["obj_id"], "operator": "Equal", "valueString": id}
                for id in ids
            ]
        })
    # bm25_result = bm25_retriever.retrieve(
    #     query=query,
    #     filters=filters,
    #     top_k=10
    # )
    docs = build.do()
    docs = docs['data']['Get']['Object']
    docs = [
        {**doc, 'id': doc['obj_id']}
        for doc in docs
    ]
    docs = [
        document_store._convert_weaviate_result_to_document(doc, return_embedding=False)
        for doc in docs
    ]

    result = rag_generator.predict(
        query='What are the best party games for adults?',
        documents=docs,
        top_k=1
    )

    # # Change `minimum` to `medium` or `all` to raise the level of detail
    # print_answers(result, details="all")
    print(result)
    return None
