import torch
import numpy as np

def fix_np(arr, to_torch=False):
    # revisit: when getting directly, ValueError: setting an array element with a sequence.
    # for some reason the embedding column from a dataframe is dtype=object, even
    # if I try to coerce it to float32. If I unwrap it then wrap it, we're good :/
    if isinstance(arr, np.ndarray):
        arr = arr.tolist()
    arr = np.array(arr, dtype=np.float32)
    if to_torch:
        return torch.tensor(arr, device="cpu")
    return arr
