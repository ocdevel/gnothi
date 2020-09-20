import pdb, requests, re, os, pickle, random, os
from pprint import pprint
from box import Box
from common.database import session
from common.utils import vars, is_test

BASE = '/storage/fixtures'

# double-neg: if is_test() and being called/restarted server.pytest.
# ie, server.pytest re-creates DB, crashes gpu, dev.yml restarts gpu, no env var specified USE_FIXTURES
USE = not os.environ.get("NO_FIXTURES", False) and is_test()
RELOAD = os.environ.get("RELOAD_FIXTURES", False)

class Fixtures():
    def __init__(self):
        self.mkdir()
        self.mkdir("wiki")

        self.entries = self.load_entries()
        self.users = self.load_users()

    @staticmethod
    def mkdir(dir=None):
        dir = f"{BASE}/{dir}" if dir else BASE
        if not os.path.exists(dir):
            os.mkdir(dir)

    @staticmethod
    def load(f):
        f = f"{BASE}/{f}.pkl"
        if not (USE and os.path.exists(f)):
            return {}
        with open(f, 'rb') as f_:
            return pickle.load(f_)

    @staticmethod
    def save(f, obj):
        if not USE: return
        f = f"{BASE}/{f}.pkl"
        with open(f, 'wb') as f_:
            pickle.dump(obj, f_)

    def save_k_v(self, f, k, v):
        pkl = self.load(f)
        pkl[k] = v
        self.save(f, pkl)

    def load_entries(self):
        if not USE: return {}
        pkl = self.load("entries")
        if RELOAD or not pkl:
            return self.gen_entries()
        return pkl

    def load_users(self):
        u = Box(user={}, therapist={}, friend={}, other={})
        for k, _ in u.items():
            email = k + "@x.com"
            u[k] = {'email': email, 'password': email}
        return u

    def load_nlp_entries(self, keys):
        if not USE: return False
        pkl = self.load("nlp_entries")
        if RELOAD or not pkl: return False
        embeds, titles, texts, clean_txt = [], [], [], []
        for k in keys:
            tup = pkl[k]
            embeds += tup[0]
            titles.append(tup[1])
            texts.append(tup[2])
            clean_txt += tup[3]
        return embeds, titles, texts, clean_txt

    def save_nlp_entry(self, k, obj):
        self.save_k_v("nlp_entries", k, obj)

    def gen_entries(self):
        try:
            from bs4 import BeautifulSoup
            from app.cleantext import Clean
        except:
            raise("No fixtures generated, run tests on GPU first")

        urls = [
            # "https://en.wikipedia.org/wiki/Cognitive_behavioral_therapy",
            "https://en.wikipedia.org/wiki/Virtual_reality",

            # "https://en.wikipedia.org/wiki/Coronavirus_disease_2019",
            # "https://en.wikipedia.org/wiki/Beer",
            # "https://en.wikipedia.org/wiki/Clothing",
            # "https://en.wikipedia.org/wiki/The_Lord_of_the_Rings",
            # "https://en.wikipedia.org/wiki/Cat",
            # "https://en.wikipedia.org/wiki/Ocean",
            # "https://en.wikipedia.org/wiki/Astrology",
            # "https://en.wikipedia.org/wiki/QAnon",
        ]
        entries = Box()

        for url in urls:
            page = url.split("/")[-1]
            fname = f"wiki/{page}"
            content = self.load(fname)
            if not content:
                content = requests.get(url).content
                self.save(fname, content)
            soup = BeautifulSoup(content, 'html5lib')
            content = soup.find("div", id="mw-content-text")

            ps = content.find_all("p")
            i = 0
            big_entry = []
            while True:
                n_paras = random.randint(1, 7)
                paras = ps[:n_paras]
                if not paras: break # done
                ps = ps[n_paras:]
                clean = []
                for p in paras:
                    p = re.sub(r"\[[0-9]+\]", "", p.text)
                    if not re.match("[a-zA-Z]+", p):
                        continue # empty
                    p = re.sub(r"\s+", " ", p)
                    clean.append(p)
                if not clean: continue
                big_entry += clean
                k = f"{page}_{i}"
                i += 1
                entries[k] = dict(
                    text="\n\n".join(clean),
                    paras=clean
                )
            # make sure there's a huge one. 10 paras plenty
            big_entry = " ".join(big_entry[:10])
            entries[f"{page}_{i}"] = dict(
                text=big_entry,
                paras=[big_entry]
            )
            # also a tiny one? TODO
        pprint(list(entries.keys()))
        pprint(entries.Virtual_reality_0.paras)

        self.save("entries", entries)
        return entries


fixtures = Fixtures()
