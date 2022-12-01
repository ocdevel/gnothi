RECREATE = False
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

from document_store import get_document_store, init_data
from summarize import CustomSummarizer

document_store = get_document_store(RECREATE)

bm25_retriever = BM25Retriever(document_store=document_store)
query_classifier = TransformersQueryClassifier()
embedding_retriever = EmbeddingRetriever(
    document_store=document_store,
    use_gpu=False,
    embedding_model="sentence-transformers/multi-qa-mpnet-base-dot-v1",
    model_format="sentence_transformers",
)
dpr_retriever = DensePassageRetriever(document_store=document_store, use_gpu=False)
farm_reader = FARMReader(
    use_gpu=False,
    model_name_or_path="deepset/roberta-base-squad2"
)
summarizer = CustomSummarizer(use_gpu=False)

class CustomPipeline(BaseStandardPipeline):
    def __init__(self):
        pipe = Pipeline()
        pipe.add_node(component=query_classifier, name="QueryClassifier", inputs=["Query"])
        pipe.add_node(component=dpr_retriever, name="DPRRetriever", inputs=["QueryClassifier.output_1"])
        pipe.add_node(component=bm25_retriever, name="BM25Retriever", inputs=["QueryClassifier.output_2"])
        pipe.add_node(component=JoinDocuments(join_mode="concatenate"), name="JoinResults",
                      inputs=["BM25Retriever", "DPRRetriever"])
        pipe.add_node(component=farm_reader, name="QAReader", inputs=["JoinResults"])
        self.pipeline = pipe
        self.metrics_filter = {"DPRRetriever": ["recall_single_hit"]}

    def run(self, query: str, params: Optional[dict] = None, debug: Optional[bool] = None):
        output = self.pipeline.run(query=query, params=params, debug=debug)
        return output


if RECREATE:
    init_data(document_store, embedding_retriever)


def main(event, context):
    pipe = CustomPipeline()
    prediction = pipe.run(
        query="arya stark father",
        params={
            "DPRRetriever": {"top_k": 10},
            "BM25Retriever": {"top_k": 10},
            "QAReader": {"top_k": 5}
        }
    )
    # Change `minimum` to `medium` or `all` to raise the level of detail
    print_answers(prediction, details="all")
    return None
