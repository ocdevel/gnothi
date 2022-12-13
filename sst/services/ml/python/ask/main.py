from common.env import USE_GPU
from haystack.nodes import FARMReader

from haystack.nodes.base import BaseComponent
SIMPLE_CLASSIFIER = True
class QueryClassifier(BaseComponent):
    outgoing_edges = 2

    def __init__(self):
        super().__init__()
        if SIMPLE_CLASSIFIER:
            pass
        else:
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
            from haystack.nodes import TransformersQueryClassifier
            self.query_classifier = TransformersQueryClassifier(use_gpu=USE_GPU)

    def run(self, query: str):
        if SIMPLE_CLASSIFIER:
            if query.endswith("?"):
                return {}, "output_1"  # question
            # if len(query) < 30:
            #     return {}, "output_2"  # keywords
            return {}, "output_2"  # statement
        else:
            return self.query_classifier.run(query)

    def run_batch(self, query):
        pass

qa_reader = FARMReader(
    "deepset/roberta-base-squad2",
    use_gpu=USE_GPU
)

def main(event, context):
    query = event.get('query', '')
    if not query:
        return {"answer": ""}
    docs = event['docs']
    res = qa_reader.predict(
        query=query,
        documents=docs,
        top_k=3,
    )
    # answer = tup[0]['answers'][0].answer  # from .run()
    answer = res['answers'][0]
    # TODO return other attrs (score, context, etc)
    return {"answer": answer}
