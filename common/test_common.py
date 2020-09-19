import pytest, pdb, pprint
from common.utils import vars
import logging
logger = logging.getLogger(__name__)

def test_vars():
    # flat
    assert vars.DB_BOOKS
    # recursive
    assert vars.DB_URL
    assert vars.HABIT_USER
    pprint.pprint(vars)
