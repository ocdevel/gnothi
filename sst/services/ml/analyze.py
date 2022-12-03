USE_GPU = False

import json
import logging
logging.basicConfig(format="%(levelname)s - %(name)s -  %(message)s", level=logging.WARNING)
logging.getLogger("haystack").setLevel(logging.INFO)

from typing import Optional, Dict, List

from haystack.nodes import (
    EmbeddingRetriever,
    RAGenerator,
    DensePassageRetriever,
    BaseComponent,
    JoinDocuments,
    FARMReader,
    TransformersQueryClassifier,
    BM25Retriever
)
from haystack.pipelines import ExtractiveQAPipeline, Pipeline, BaseStandardPipeline
from haystack.utils import print_answers

from ml.document_store import CustomDocumentStore
from ml.keywords import main as keywords
from ml.summarize import main as summarize

# farm_reader = FARMReader(
#     use_gpu=False,
#     model_name_or_path="deepset/roberta-base-squad2"
# )
# summarizer = CustomSummarizer(use_gpu=False)

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
query_classifier = TransformersQueryClassifier(use_gpu=False)
def get_query_type(query: str, run_response: str):
    if query.endswith('?'):
        return 'question'
    if run_response == 'output_2':
        return 'keyword'
    return 'statement'

doc_store = CustomDocumentStore(recreate_index=True, raw_weaviate=True)


def main(event, context):
    print("------------ IN PYTHON ------------------")
    print(event)
    task = event['event']
    docs = event['docs']
    params = event['params']
    if task == 'upsert':
        return doc_store.upsert(docs, params)
    elif task == 'keywords':
        return keywords(docs, params)
    elif task == 'summarize':
        return summarize(docs, params)


    query = event.get('search', None)
    query_type = None
    if query:
        res = query_classifier.run("arya stark father") # => ({}, 'output_2')
        query_type = get_query_type(query, res[1])
    build = (doc_store.client.query
         .get(class_name="Object", properties=["content", "obj_id"])
        .with_additional(['vector', 'certainty']))
    if not query:
        pass
    elif query_type in ['keyword', 'statement', 'question']:
        build = build.with_near_text({
            'concepts': [query],
            'certainty': .2
        })
    # elif query_type == 'question':
    #     build = (build.with_ask({
    #             'question': query,
    #         })
    #         .with_limit(1)
    #         .with_additional({'answer': ['result', 'hasAnswer']})
    #      )
    docs = build.do()
    print(docs)


    FARMReader().run()

    # prediction = pipe.run(
    #     query="arya stark father",
    #     params={
    #         "DPRRetriever": {"top_k": 10},
    #         "BM25Retriever": {"top_k": 10},
    #         "QAReader": {"top_k": 5}
    #     }
    # )
    # # Change `minimum` to `medium` or `all` to raise the level of detail
    # print_answers(prediction, details="all")
    return None
