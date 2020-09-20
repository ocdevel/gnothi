import pdb, requests, re, os, pickle, random
from pprint import pprint
from box import Box


class Fixtures():
    def __init__(self):
        self.entries = self.load_entries()
        self.users = self.load_users()

    def load_entries(self):
        fname = '/storage/fixtures/entries.pkl'
        reload = os.environ.get('RELOAD_FIXTURES', False)
        if reload or not os.path.exists(fname):
            self.gen_entries()
        with open(fname, 'rb') as f:
            return pickle.load(f)

    def load_users(self):
        return {}

    def mkdir(self, dir):
        if not os.path.exists(dir):
            os.mkdir(dir)

    def gen_entries(self):
        try:
            from bs4 import BeautifulSoup
            from app.cleantext import Clean
        except:
            raise("No fixtures generated, run tests on GPU first")

        urls = [
            "https://en.wikipedia.org/wiki/Cognitive_behavioral_therapy",
            "https://en.wikipedia.org/wiki/Virtual_reality",
            "https://en.wikipedia.org/wiki/Coronavirus_disease_2019",
            # "https://en.wikipedia.org/wiki/Beer",
            # "https://en.wikipedia.org/wiki/Clothing",
            # "https://en.wikipedia.org/wiki/The_Lord_of_the_Rings",
            "https://en.wikipedia.org/wiki/Cat",
            # "https://en.wikipedia.org/wiki/Ocean",
            "https://en.wikipedia.org/wiki/Astrology",
            # "https://en.wikipedia.org/wiki/QAnon",
        ]
        entries = Box()
        base = '/storage/fixtures'
        self.mkdir(base)
        self.mkdir(base + "/wiki")

        for url in urls:
            page = url.split("/")[-1]
            fname = f"{base}/wiki/{page}"
            if os.path.exists(fname):
                with open(fname, "rb") as f:
                    content = pickle.load(f)
            else:
                content = requests.get(url).content
                with open(fname, "wb") as f:
                    pickle.dump(content, f)
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

        with open(base + "/entries.pkl", "wb") as f:
            pickle.dump(entries, f)
