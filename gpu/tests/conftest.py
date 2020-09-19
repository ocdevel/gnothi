import os
os.environ['ENVIRONMENT'] = 'testing'

import pytest
from app.nlp import NLP

nlp_ = NLP()


@pytest.fixture(scope='module', autouse=True)
def clear_nlp():
    nlp_.clear()
