import os
os.environ['ENVIRONMENT'] = 'testing'

import pytest
from app.nlp import NLP
from common.fixtures import Fixtures

nlp_ = NLP()
fixtures = Fixtures()

@pytest.fixture(scope='module', autouse=True)
def clear_nlp():
    nlp_.clear()


@pytest.fixture(scope='session')
def entries():
    return fixtures.entries

@pytest.fixture(scope='session')
def users():
    return fixtures.users
