EFS = "/mnt/mldata"
VECTORS_PATH = f"{EFS}/vectors"
MODELS_PATH = f"{EFS}/models"

import os
# I tried setting the first two as ENV in Dockerfile but no cigar.
# Now I'm just blasting all possibilities. Lambda is read-only outside /mnt and /tmp
for env_key in [
    'TRANSFORMERS_CACHE',
    'HF_MODULES_CACHE',
    'HF_HOME',
    'XDG_CACHE_HOME'
    'TORCH_HOME',
    'PYTORCH_PRETRAINED_BERT_CACHE',
    'PYTORCH_TRANSFORMERS_CACHE',
    'SENTENCE_TRANSFORMERS_HOME'
]:
    os.environ[env_key] = MODELS_PATH

USE_GPU = os.getenv("CUDA_VISIBLE_DEVICES", False)
if not USE_GPU:
    # not present on env, explicitly tell downstream tasks not to use GPU by
    # hard-setting this value
    os.environ["CUDA_VISIBLE_DEVICES"] = ""

import logging
logging.basicConfig(format="%(levelname)s - %(name)s - %(message)s", level=logging.WARNING)

ENCODER_MODEL = "all-MiniLM-L6-v2"
ENCODER_DIM = 384
