import common.database as D
import common.models as M

def test_basic(u):
    assert len(u) == 5
    assert u.user1.first_name == 'first_name_1'
