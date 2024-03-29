import pdb, pickle, random, os, shutil, datetime
from box import Box
from data.database import session
from settings import settings, is_test
import data.models as M
from sqlalchemy import text
import logging
logger = logging.getLogger(__name__)

BASE = '/storage/fixtures'

# double-neg: if is_test() and being called/restarted server.pytest.
# ie, server.pytest re-creates DB, crashes gpu, dev.yml restarts gpu, no env var specified USE_FIXTURES
USE = not os.environ.get("NO_FIXTURES", False) and is_test()
FRESH = os.environ.get("FRESH_FIXTURES", "")

class Fixtures():
    def __init__(self):
        self.clear_fixtures()
        self.mkdir()

        self.entries = self.load_entries()
        self.users = self.load_users()

    def rm(self, path, isdir=False):
        try:
            if isdir: shutil.rmtree(path)
            else: os.remove(path)
            print(f"Deleted {path}")
        except:
            print(f"FAILED to delete {path}")

    def clear_fixtures(self):
        all_ = FRESH == 'all'
        if 'books' in FRESH or all_:
            self.rm(f"{BASE}/books.pkl")
            with session() as sess:
                sess.execute("delete from books")
                sess.commit()
        if 'entries' in FRESH or all_:
            self.rm(f"{BASE}/entries.pkl")
            self.rm(f"{BASE}/nlp_entries.pkl")
        if 'profiles' in FRESH or all_:
            self.rm(f"{BASE}/nlp_profiles.pkl")
        if 'influencers' in FRESH or all_:
            self.rm(f"{BASE}/xgb_hypers.pkl")
        if 'libgen.npy' in FRESH or all_: self.rm(f"/storage/libgen/testing_all.npy")
        if 'libgen.df' in FRESH or all_: self.rm(f"/storage/libgen/testing_all.df")
        if 'libgen.tf' in FRESH or all_: self.rm(f"/storage/libgen/testing_all.tf", isdir=True)
        if 'libgen.min.npy' in FRESH or all_: self.rm(f"/storage/libgen/testing_all.min.npy")

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
        pkl[str(k)] = v
        self.save(f, pkl)

    def load_entries(self):
        if not USE: return {}
        pkl = self.load("entries")
        if not pkl:
            return self.gen_entries()
        return pkl

    def load_users(self, hash=True):
        if not USE: return {}
        # TODO get rid of just therapist, used in a lot of places currently
        keys = 'user therapist friend other therapist_vr therapist_mix therapist_cbt therapist_na'.split()
        u = Box()
        for k in keys:
            email = k + "@x.com"
            pass_k = 'hashed_password' if hash else 'password'
            u[k] = {'email': email, pass_k: email, 'first_name': k}
            if k.startswith('therapist'):
                u[k]['therapist'] = True

        e = self.load_entries()
        vr1, vr2 = e.vr_0.text, e.vr_1.text
        cbt1, cbt2 = e.cbt_0.text, e.cbt_1.text

        u.therapist_vr.bio = vr1 + "\n\n" + vr2
        u.therapist_mix.bio = vr1 + "\n\n" + cbt1
        u.therapist_cbt.bio = cbt1 + "\n\n" + cbt2
        u.therapist_na.bio = None
        return u

    def uid_to_email(self, uid):
        with session() as sess:
            return sess.execute(text("""
            select email from users where id=:uid
            """), dict(uid=uid)).fetchone().email

    def eid_to_title(self, eid):
        with session() as sess:
            return sess.execute(text("""
            select title from entries where id=:eid
            """), dict(eid=eid)).fetchone().title

    def submit_fields(self, uid, db, client=None, header=None, n_days=20):
        if not USE: return
        # if sess, it's coming from GPU: save to DB. If client, coming from server: POST.
        for i in list(range(10)):
            field = dict(
                type='fivestar',
                name=str(i),
                default_value='average',
            )
            fid = None
            if client:
                res = client.post("/fields", json=field, **header)
                assert res.status_code == 200
                fid = res.json()['id']
            else:
                field = M.Field(**field, user_id=uid)
                db.add(field)
                db.commit()
                db.refresh(field)
                fid = field.id

            # create field-entries for x days
            # stagger range() as if we're creating new fields each day
            for d in range(n_days - i):
                # leave some nulls in there
                if random.randint(0, 4) == 0: continue
                # some trends, so not all scores 0.
                value = d + random.randint(-1, 1)
                created_at = datetime.datetime.today() - datetime.timedelta(days=d)
                if client:
                    fe = client.post(
                        f"/field-entries/{fid}",
                        json=dict(value=value),
                        **header
                    )
                    assert fe.status_code == 200
                    feid = fe.json()['id']
                    db.execute(text("""
                    update field_entries2 set created_at=:c where id=:feid 
                    """), dict(c=created_at, feid=feid))
                    db.commit()
                else:
                    M.FieldEntry.upsert(db, uid, fid, value, str(created_at.date()))

    def load_xgb_hypers(self, uid):
        if not USE: return
        hypers = self.load("xgb_hypers")
        return hypers.get(self.uid_to_email(uid), None)

    def save_xgb_hypers(self, uid, hypers):
        if not USE: return
        self.save_k_v("xgb_hypers", self.uid_to_email(uid), hypers)

    def load_books(self, user_id):
        pkl = self.load("books")
        if not pkl: return None
        k = self.uid_to_email(user_id)
        return pkl.get(k, None)

    def save_books(self, user_id, books):
        k = self.uid_to_email(user_id)
        self.save_k_v("books", k, books)

    def load_nlp_rows(self, keys, method='entries'):
        if not USE: return None
        pkl = self.load(f"nlp_{method}")
        if not pkl: return None
        if not pkl.get(keys[0], None):
            # this batch hasn't been processed yet
            return None
        if method == 'entries':
            embeds, titles, texts = [], [], []
        else:
            embeds = []
        for k in keys:
            tup = pkl[k]
            embeds += tup[0]
            if method == 'entries':
                titles.append(tup[1])
                texts.append(tup[2])

        return (embeds, titles, texts) if method == 'entries'\
            else (embeds,)

    def save_nlp_row(self, k, obj, method='entries'):
        self.save_k_v(f"nlp_{method}", k, obj)

    def gen_entries(self):
        try:
            # the generates article-fixtures on the GPU container, which then become available in /storage
            # to the server container. So run tests on GPU first, then on esrver. TODO decouple this!
            from ml_tools.fixtures import articles
        except:
            raise Exception("Can't generate entries from server container, must do from GPU container first.")
        entries = articles(group_by='paragraph')
        entries = Box({
            k: dict(text=v, paras=v.split('\n\n'))
            for k, v in entries.items()
        })
        self.save("entries", entries)
        return entries


fixtures = Fixtures()
