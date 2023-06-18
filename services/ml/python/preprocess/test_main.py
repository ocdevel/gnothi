import pytest
from preprocess.main import main

text = """
# Title
This line should be concatenated with title

## Subtitle
So there should be two paras total
* even
* with 
* line items
"""

def test_main():
    res = main({
        "method": "md2txt",
        "text": text
    }, {})
    assert '#' not in res['text']
    assert '*' not in res['text']
    assert len(res['paras']) == 2
