import pytest
from sentence_transformers import SentenceTransformer
from books.main import main
import re

model = SentenceTransformer(model_name_or_path="all-MiniLM-L6-v2")

def test_books():
    emb = model.encode(["Cognitive behavioral therapy for anxiety"])
    json_emb = emb.tolist()
    res = main({
        'embedding': json_emb
    }, {})
    search = re.compile("(cbt)|(cognitive behavior)", re.IGNORECASE)
    found = False
    for book in res:
        name = book['name']
        print(name)
        if search.search(name):
            found = True
    assert found
