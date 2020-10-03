import pdb, pytest
from app.nlp import NLP
nlp_ = NLP()

@pytest.fixture(scope='module', autouse=True)
def paras(entries):
    paras = entries.vr_0.paras
    assert len(paras) > 0
    return paras.to_list()


@pytest.fixture(scope='module', autouse=True)
def groups(entries):
    return [
        e.paras.to_list() for k, e in entries.items()
        if k.startswith("vr")
    ]

class TestNoGroup():
    def test_empty(self, paras):
        res = nlp_.summarization([])
        assert len(res) == 1
        res = res[0]
        assert res['summary'] is None
        assert not res['sentiment']

    def test_basic(self, paras):
        res = nlp_.summarization(paras)
        assert len(res) == 1
        res = res[0]
        assert 'VR' in res['summary'] or "Virtual" in res['summary']
        assert len(res['sentiment'])

    def test_nosent(self, paras):
        res = nlp_.summarization(paras, with_sentiment=False)
        assert len(res) == 1
        res = res[0]
        assert not res['sentiment']

    def test_min_max(self, paras):
        res = nlp_.summarization(paras, min_length=5, max_length=20)
        assert len(res) == 1
        res = res[0]
        assert 'VR' in res['summary'] or "Virtual" in res['summary']
        assert len(res['sentiment'])

class TestGroup():
    @pytest.mark.skip()
    def test_empty(self, groups):
        # how to handle multi-empty (paras job)?
        res = nlp_.summarization([[]])
        assert len(res) == 1
        res = res[0]
        assert res['summary'] is None
        assert not res['sentiment']

    def test_basic(self, groups):
        res = nlp_.summarization(groups)
        assert len(res) == len(groups)
        res = res[0]
        assert 'VR' in res['summary'] or "Virtual" in res['summary']
        assert len(res['sentiment'])

    def test_nosent(self, groups):
        res = nlp_.summarization(groups, with_sentiment=False)
        assert len(res) == len(groups)
        res = res[0]
        assert not res['sentiment']

    def test_min_max(self, groups):
        res = nlp_.summarization(groups, min_length=5, max_length=20)
        assert len(res) == len(groups)
        res = res[0]
        assert 'VR' in res['summary'] or "Virtual" in res['summary']
        assert len(res['sentiment'])
