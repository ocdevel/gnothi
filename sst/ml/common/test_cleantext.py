import pytest, pdb
from common.preprocess import CleanText
from common.fixtures import articles

def test_md_split_1():
    doc = articles()[0]
    paras = CleanText(doc) \
        .markdown_split_paragraphs() \
        .value()
    assert len(paras) > 1
    print(paras)

def test_md_split_all():
    docs = articles()
    paras = CleanText(docs)\
        .markdown_split_paragraphs()\
        .value()
    assert len(paras) > 0
    assert len(docs) < len(paras)
    print(paras)


@pytest.mark.parametrize("content", [
    (4, """
# Day 1
Lorem Ipsum is simply dummy text of the printing and typesetting industry. 
Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. 
* LI One
  * LI One Sub
* LI Two
* LI Three

It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.

# Day 2
Lorem Ipsum is simply dummy text of the printing and typesetting industry.

  1. OL One
  1. OL Two
  1. OL Three

Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.

"""),

    (1, "hello there"),

    (1, "*hello there*"),

    (1, "_hello_ there"),

    (1, "# testing 1 2 3"),

    (3, ["sentence one", "sentence two\n\nmultiple lines"])
])
def test_md_split_specific(content):
    ct, md = content
    res = CleanText(md).markdown_split_paragraphs().value()
    print(res)
    assert len(res) == ct


# github.com/lefnire/ml-tools - test chaining + keywords + join

@pytest.mark.parametrize("content", [
"hello",

"*hello*",

"_hello_",

"# test",

"""# Markdown Title
Here is a list of items
* list item 1
* list item 2

## Next section
This is a paragraph. Blah bla blah.
""",
])
def test_unmark(content):
    res = CleanText(content).unmark().value()
    print(res)
    assert type(res) == str
    assert "#" not in res
    assert "*" not in res


@pytest.mark.parametrize("content", [
"hello",

"<span>test</span>",

"""<html>
<body><p>Test string</p></body>
</html>"""
])
def test_strip_html(content):
    res = CleanText([content]).strip_html().value()
    print(res)
    assert type(res) == str
    assert "<" not in res


# github.com/lefnire/ml-tools - test join + keywords + token-cleanup
