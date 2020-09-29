import torch
import tensorflow.keras.backend as K

def clear_gpu():
    torch.cuda.empty_cache()
    K.clear_session()
