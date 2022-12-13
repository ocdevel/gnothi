import torch
import numpy as np

def fix_np(arr):
    # revisit: when getting directly, ValueError: setting an array element with a sequence.
    # for some reason the embedding column from a dataframe is dtype=object, even
    # if I try to coerce it to float32. If I unwrap it then wrap it, we're good :/
    if isinstance(arr, np.ndarray):
        arr = arr.tolist()
    return np.array(arr, dtype=np.float32)
    # return torch.tensor(nparr, device="cpu")
