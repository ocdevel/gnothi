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
    TransformersQueryClassifier
)
from haystack.pipelines import ExtractiveQAPipeline, Pipeline, BaseStandardPipeline
from haystack.utils import print_answers

from document_store import get_document_store, init_data
from summarize import CustomSummarizer


class QueryClassifier(BaseComponent):
    # https://docs.haystack.deepset.ai/docs/nodes_overview
    # TODO try built-in classifier: https://docs.haystack.deepset.ai/docs/query_classifier
    outgoing_edges = 3

    def run(self, query):
        # No search provided, just use the pre-filtered docs for clustering/summarization
        if not query:
            return {}, "output_1"
        # Query was a question
        elif "?" in query:
            return {}, "output_2"
        # Query was a search
        else:
            return {}, "output_3"


document_store = get_document_store(RECREATE)

embedding_retriever = EmbeddingRetriever(
    document_store=document_store,
    embedding_model="sentence-transformers/multi-qa-mpnet-base-dot-v1",
    model_format="sentence_transformers",
    use_gpu=USE_GPU
)
dpr_retriever = DensePassageRetriever(
    document_store=document_store,
    use_gpu=USE_GPU
)
farm_reader = FARMReader(
    model_name_or_path="deepset/roberta-base-squad2",
    use_gpu=USE_GPU
)
summarizer = CustomSummarizer()

class CustomPipeline(BaseStandardPipeline):
    def __init__(self):
        pipe = Pipeline()
        pipe.add_node(component=QueryClassifier(), name="QueryClassifier", inputs=["Query"])
        pipe.add_node(component=embedding_retriever, name="EmbeddingRetriever", inputs=["QueryClassifier.output_2"])
        pipe.add_node(component=dpr_retriever, name="DPRRetriever", inputs=["QueryClassifier.output_3"])
        pipe.add_node(component=JoinDocuments(join_mode="concatenate"), name="JoinResults",
                      inputs=["QueryClassifier.output_1", "EmbeddingRetriever", "DPRRetriever"])
        pipe.add_node(component=farm_reader, name="QAReader", inputs=["JoinResults"])
        self.pipeline = pipe
        self.metrics_filter = {"Retriever": ["recall_single_hit"]}

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
            "Retriever": {"top_k": 10},
            "Reader": {"top_k": 5}
        }
    )
    # Change `minimum` to `medium` or `all` to raise the level of detail
    print_answers(prediction, details="all")
    return None
