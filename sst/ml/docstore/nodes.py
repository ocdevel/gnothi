from common.env import USE_GPU

# use for most things. Likely even QA
# max_seq_len=384 dims=768 score=dot|cosine
embedding_model = "sentence-transformers/all-mpnet-base-v2"
# Better for QA, but might require saving another set of vectors? Might not use
# max_seq_len=512 dims=768 score=dot|cosine
qa_model = "sentence-transformers/multi-qa-mpnet-base-dot-v1"
similarity = "dot"  # "dot_product"
embedding_dim = 768


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


# Since we're running these in Lambdas, only load then cache what's required.
# We have enough RAM for all of them, but want to reduce the cold-start. Most
# operations will only upsert (embed). After the embedding op, might want to
# warm-load the QA/Search module before they hit that page
class Nodes(object):
    def __init__(self):
        self._embedding_retriever = None
        self._farm_reader = None
        self._query_classifier = None

    def embedding_retriever(self, **kwargs):
        if not self._embedding_retriever:
            from haystack.nodes import EmbeddingRetriever
            self._embedding_retriever = EmbeddingRetriever(
                embedding_model=embedding_model,
                model_format="sentence_transformers",
                max_seq_len=384,
                use_gpu=USE_GPU,
                **kwargs
            )
        return self._embedding_retriever
    def farm_reader(self):
        if not self._farm_reader:
            from haystack.nodes import FARMReader, BM25Retriever
            self._farm_reader = FARMReader(
                model_name_or_path="deepset/roberta-base-squad2",
                use_gpu=USE_GPU
            )
        return self._farm_reader

    def query_classifier(self):
        if not self._query_classifier:
            self._query_classifier = QueryClassifier()
        return self._query_classifier


nodes = Nodes()


###
# Consider these modules later
###
# from haystack.nodes import DensePassageRetriever
# dpr_retriever = DensePassageRetriever(
#     document_store=store.document_store,
#     use_gpu=USE_GPU
#     # query_embedding_model="facebook/dpr-question_encoder-single-nq-base",
#     # passage_embedding_model="facebook/dpr-ctx_encoder-single-nq-base"
# )
#
# from haystack.nodes import RAGenerator
# rag_generator = RAGenerator(
#     model_name_or_path="facebook/rag-sequence-nq",
#     retriever=dpr_retriever,
#     top_k=3,
#     min_length=3,
#     use_gpu=USE_GPU
# )
