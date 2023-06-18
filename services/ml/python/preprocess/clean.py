import string, re, os, pdb, os
import html as ihtml
from bs4 import BeautifulSoup
from typing import List
from box import Box
from markdown2 import Markdown
from markdownify import markdownify
from cleantext import clean

import logging
logger = logging.getLogger(__name__)

# See gensim.parsing.preprocessing.RE_PUNCT
# RE_PUNCT = re.compile(r'([%s])+' % re.escape(string.punctuation), re.UNICODE)
RE_PUNCT = r'[%s]' % re.escape(string.punctuation)


def resub(pattern, replace_with, txt):
    return re.sub(pattern, replace_with, txt, flags=re.IGNORECASE)


md = Markdown(extras=["cuddled-lists"])
def md2txt(s):
    return html2txt(md.convert(s))

def html2md(s):
    return markdownify(s)


def html2txt(s):
    # s = UnicodeDammit.detwingle(s.encode()).decode()
    s = ihtml.unescape(s)  # is this necessary?
    return BeautifulSoup(s, "html5lib").text


def one_or_many(batch=False, keep=None):
    """
    Wraps each cleantext method so you can pass in either a single string or list.
    :param batch: True if a method expects to process all docs together (eg, lemmatization)
    :param keep: A string key for saving away intermediate values for access later on `.data`. If used,
        method should return a tuple (result, thing_to_keep). Eg, for lemmatization, it returns the lemmatized text
        but also keeps the unique lemmas themselves, so you can debug later via cleantxt.data.lemmas
    """
    def decorator(fn):
        def wrapper(self, *args, **kwargs):
            txt = self.result
            single = type(txt) == str
            if single: txt = [txt]
            # most functions can't handle empty strings
            txt = [t or "empty" for t in txt]
            txt = fn(self, txt, *args, **kwargs) if batch\
                else  [fn(self, s, *args, **kwargs) for s in txt]

            data = self.data
            if keep:
                data[keep] = txt[-1]
                txt = txt[0]
            return self.__class__(txt, fn.__name__, data)
        return wrapper
    return decorator


class CleanText:
    def __init__(self, txt, last_fn=None, data=None):
        self.result = txt
        self.last_fn = last_fn
        self.data = data or Box()

    def value(self):
        txt = self.result
        if self.last_fn == 'markdown_split_paragraphs':
            # ensure it stays wrapped, even if just one paragraph
            return txt
        return txt[0] if len(txt) == 1 else txt
    @one_or_many()
    def unmark(self, s):
        return md2txt(s)

    @one_or_many()
    def fix_punct(self, s):
        return re.sub(rf"({RE_PUNCT})([a-zA-Z])", r"\1 \2", s)

    @one_or_many()
    def only_ascii(self, s):
        # return re.sub(r"[^\x00-\x7F\xA9]+", "", s)
        return clean(
            s,
            fix_unicode=True,
            to_ascii=True,
            lang="en"
        )

    @one_or_many()
    def only_english(self, s):
        s = re.sub("[\uac00-\ud7a3]+", 'korean', s)
        s = re.sub("[\u3040-\u30ff]+", 'japanese', s)
        s = re.sub("[\u4e00-\u9FFF]+", 'chinese', s)
        return s

    @staticmethod
    def ensure_punct(s):
        s = s.strip()
        if not re.search(rf"{RE_PUNCT}$", s):
            s += "."
        return s

    @one_or_many()
    def strip_html(self, s):
        s = html2txt(s)
        return clean(
            s,
            no_urls=True,
            no_emails=True,
            no_phone_numbers=True,
            lang="en"
        )
        return s

    @one_or_many()
    def remove_apos(self, s):
        # call this before removing punctuation via gensim/spacy, since they're replaced with space
        return re.sub(r"'", "", s)

    @one_or_many()
    def multiple_whitespace(self, s):
        return " ".join(s.split())

    # github.com/lefnire/ml-tools for normalize_numbers

    @one_or_many(batch=True)
    def markdown_split_paragraphs(self, docs):
        # Convert doc(s) into paragraphs.
        paras = []
        for doc in docs:
            soup = BeautifulSoup(md.convert(doc), "html5lib")\
                .find("body").findChildren(recursive=False)
            last_tag = ""
            for t in soup:
                tag, text = t.name, t.text
                if not text: continue
                text = ' '.join([
                    self.ensure_punct(line)
                    for line in text.split('\n')
                    if line
                ])
                start_new = not paras or\
                    tag.startswith('h') or\
                    (tag == 'p' and not last_tag.startswith('h'))
                if start_new:
                    paras.append(text)
                else:
                    paras[-1] += " " + text
                last_tag = tag
        return [
            p for p in paras
            # ensure at least one word per paragraph
            if len(re.findall(r"\S+", p)) > 1
        ]

    # github.com/lefnire/ml-tools - join() for list flattening
    # github.com/lefnire/ml-tools - keywords()
