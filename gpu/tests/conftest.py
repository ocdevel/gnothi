import os
os.environ['IS_TESTING'] = '1'

import pytest
from app.nlp import NLP

nlp_ = NLP()


@pytest.fixture(scope='module', autouse=True)
def clear_nlp():
    nlp_.clear()
