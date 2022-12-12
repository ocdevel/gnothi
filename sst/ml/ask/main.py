from common.env import USE_GPU
from haystack.nodes import FARMReader
from transformers import file_utils
print("default_cache_path", file_utils.default_cache_path)

qa_reader = FARMReader(
    "deepset/roberta-base-squad2",
    use_gpu=USE_GPU
)

def main(event, context):
