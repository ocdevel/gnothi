import pytest
from docstore.add_entry import add_entry
from uuid import uuid4

entry = """
# This is the title
This is an entry in markdown. It should be split into multiple paragraphs
* list items
* should be
* combined into
* one.

## A second section
The result should be 2 paragraphs, 1 entry. *bold* and _italic_ items removed, etc. The final result should have summary, themes, and emotion.
"""

def test_add_entry():
    res = add_entry({
        "id": str(uuid4()),
        "text": entry
    })
    print(res)
