import string, re, os
from bs4 import BeautifulSoup
from tqdm import tqdm
from utils import THREADS
from gensim.models.phrases import Phrases, Phraser
from gensim.parsing import preprocessing as pp

import spacy
import lemminflect
nlp = spacy.load('en_core_web_sm', disable=['parser', 'ner'])

from markdown import Markdown
from io import StringIO

def unmark_element(element, stream=None):
    if stream is None:
        stream = StringIO()
    if element.text:
        stream.write(element.text)
    for sub in element:
        unmark_element(sub, stream)
    if element.tail:
        stream.write(element.tail)
    return stream.getvalue()

# patching Markdown
Markdown.output_formats["plain"] = unmark_element
__md = Markdown(output_format="plain")
__md.stripTopLevelTags = False

def unmark(text):
    return __md.convert(text)


class Clean():
    # TODO use RE_PUNCT inserts for proper punctuation handling. See gensim.parsing.preprocessing.RE_PUNCT
    # RE_PUNCT = re.compile(r'([%s])+' % re.escape(string.punctuation), re.UNICODE)
    RE_PUNCT = "[.,!;?]"

    @staticmethod
    def unmark(s):
        return unmark(s)

    @staticmethod
    def fix_punct(s):
        return re.sub(rf"({Clean.RE_PUNCT})([a-zA-Z])", r"\1 \2", s)

    @staticmethod
    def only_ascii(s):
        return re.sub(r"[^\x00-\x7F\xA9]+", "", s)

    @staticmethod
    def ends_w_punct(s):
        return re.search(rf"{Clean.RE_PUNCT}$", s)

    @staticmethod
    def strip_html(s):
        return BeautifulSoup(s, "html5lib").text

    @staticmethod
    def remove_apos(s):
        # call this before removing punctuation via gensim/spacy, since they're replaced with space
        return re.sub(r"'", "", s)

    @staticmethod
    def urls(s):
        return re.sub(r"http[s]?://\S+", "url", s)

    @staticmethod
    def multiple_whitespace(s):
        return pp.strip_multiple_whitespaces(s)
        # return re.sub("\s+", "", s)  # temp: gensim slow download on tether

    @staticmethod
    def is_markup_block(i, lines):
        s = lines[i]
        s_next = lines[i+1] if i+1 < len(lines) else ''
        RE_LI =  r"^\s*([*\-+]|[0-9]+\.)"
        is_block = False

        # heading
        if re.search(r"^[#]+", s):
            is_block = True
            end_with = "."
        # li (come before UL for inline replacement)
        elif re.search(RE_LI, s):
            s = re.sub("^\s*", "", s)  # unmark doesn't like spaces before li's
            is_block = True
            end_with = ";"
        # ul
        elif re.search(RE_LI, s_next):
            is_block = True
            end_with = ":"

        if not is_block: return False, ""
        s = unmark(s)
        s = s if Clean.ends_w_punct(s) else s + end_with
        return True, s

    @staticmethod
    def entries_to_paras(entries):
        # Convert entries into paragraphs. Do some basic cleanup
        paras = []
        def clean_append(p):
            p = unmark(p)

            if len(p) < 128: return
            p = Clean.fix_punct(p)
            p = Clean.only_ascii(p)
            p = Clean.multiple_whitespace(p)
            if not Clean.ends_w_punct(p):
                p = p + "."
            paras.append(p)

        entries = "\n\n".join(entries)
        lines = re.split('\n+', entries)
        block_agg = []
        for i, line in enumerate(lines):
            # For consistent markdown blocks (title, list-header, list-items) group them all into one paragraph.
            # Once no more block detected, bust it.
            is_block, block_txt = Clean.is_markup_block(i, lines)
            if is_block:
                block_agg.append(block_txt)
                continue
            elif len(block_agg) > 0:
                block = " ".join(block_agg)
                block_agg.clear()
                clean_append(block)
            clean_append(line)
        return paras

    @staticmethod
    def lda_texts(entries, propn=False):
        # entries = [s.lower() for s in entries]

        pbar = tqdm(total=len(entries))
        docs = []
        postags = ['NOUN', 'ADJ', 'VERB', 'ADV']
        # Should only be true for user viewing their account (eg, not for book-rec sor other features)
        if propn: postags.append('PROPN')
        # for doc in tqdm(nlp.pipe(entries, n_process=THREADS, batch_size=1000)):
        for doc in tqdm(nlp.pipe(entries, n_threads=THREADS, batch_size=1000)):
            pbar.update(1)
            if not doc: continue
            tokens = []
            for t in doc:
                if t.pos_ == 'NUM': tokens.append('number')
                # elif t.pos_ == 'SYM': tokens.append('symbol')
                elif t.is_stop or t.is_punct: continue
                elif t.pos_ not in postags: continue
                else:
                    token = t._.lemma().lower()
                    token = pp.strip_non_alphanum(token)
                    # token = Clean.only_ascii(token)
                    if len(token) < 2: continue
                    tokens.append(token)
            docs.append(tokens)
        pbar.close()

        # Bigrams
        thresh = 2  # 1000 # higher threshold fewer phrases.
        phrases = Phrases(docs, min_count=1, threshold=thresh)
        bigram = Phraser(phrases)
        docs = [bigram[doc] for doc in docs]

        return docs