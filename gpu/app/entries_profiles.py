import pdb, os
import pandas as pd
import numpy as np
import common.models as M
from common.database import session
from ml_tools import Similars, CleanText
from common.fixtures import fixtures
from sqlalchemy import text
from common.utils import vars
from sqlalchemy.sql.expression import func
from sqlalchemy.dialects import postgresql
import sqlalchemy as sa
from app.nlp import nlp_
import logging
from datetime import datetime, timedelta
logger = logging.getLogger(__name__)


def nlp_on_rows_(method, id, job_id, sess, uids):
    """
    Generate cache_{method} for all missing rows for this user. Eg, for entries we generate
    BERT,paras,clean for the entry specified by id; but also fill in any missing entries in the process.
    Then it checks if any users have missing rows (recursive call) and runs for them too.
    """

    # keep job alive, in case we're recursing and it's taking long
    if job_id is not None:
        sess.execute(text(f"""
        update jobs set updated_at=now() where id=:job_id
        """), dict(job_id=str(job_id)))
        sess.commit()

    for_entries = method == 'entries'  # else is_profile
    m = M.Entry if for_entries else M.User
    # TODO id ignored for now, just grab everything that needs updating
    if for_entries:
        # main_entry = sess.query(m).get(id)
        rows_ = sess.query(m).filter(
            m.text.isnot(None),
            m.no_ai.isnot(True),
            m.ai_ran.isnot(True),
            # m.user_id == main_entry.user_id
        ).limit(10)
    else:
        rows_ = sess.query(m).filter(
            m.bio.isnot(None),
            m.ai_ran.isnot(True)
        ).limit(10)
    rows_ = rows_.all()
    # finished recursing
    if not rows_: return uids

    rows = []
    paras_grouped = []
    for r in rows_:
        txt = r.text if for_entries \
            else r.bio  # r.profile_to_text()  # TODO profile_to_text adds people
        paras = CleanText([txt]).markdown_split_paragraphs().value()
        if not paras:
            # Set everything with not-enough-content to ai_ran, and skip
            if for_entries:
                r.title_summary = r.text_summary = r.sentiment = None
            r.ai_ran = True
            sess.commit()
            continue
        uids.add(r.user_id if for_entries else r.id)
        rows.append(r)
        paras_grouped.append(paras)

    # Everything was too-short of content, nothing to do now.
    if not rows: return uids

    paras_flat = [p for paras in paras_grouped for p in paras]

    fkeys = [r.title for r in rows] \
        if for_entries else [r.email for r in rows]
    fixt = fixtures.load_nlp_rows(fkeys, method=method)
    if fixt:
        if for_entries:
            embeds, titles, texts = fixt
        else:
            embeds = fixt
    else:
        # embeds = Similars(paras_flat).embed().autoencode(save_load_path=vars.AE_PATH).value()
        embeds = nlp_.sentence_encode(paras_flat).tolist()
        if for_entries:
            titles = nlp_.summarization(paras_grouped, min_length=5, max_length=20, with_sentiment=False)
            texts = nlp_.summarization(paras_grouped, min_length=30, max_length=250)

    upserts = []
    for i, r in enumerate(rows):
        # Save the cache_entry (paras,clean,vectors)
        paras = paras_grouped[i]
        ct = len(paras)
        id_key = {'entries': 'entry_id', 'profiles': 'user_id'}[method]
        upserts.append({
            id_key: r.id,
            'paras': paras,
            'vectors': embeds[:ct],
        })

        # Save the fixture for later
        fixt = (embeds[:ct], titles[i], texts[i]) \
            if for_entries else (embeds[:ct],)
        fixt_k = r.title if for_entries else r.email
        fixtures.save_nlp_row(fixt_k, fixt, method=method)

        embeds = embeds[ct:]

        if for_entries:
            r.title_summary = titles[i]["summary"]
            r.text_summary = texts[i]["summary"]
            r.sentiment = texts[i]["sentiment"]
        r.ai_ran = True
        # sess.commit()  # deferring till later, so queue up writes for perf

    m = M.CacheEntry if for_entries else M.CacheUser
    insert = postgresql.insert(m.__table__).values(upserts)
    sess.execute(insert.on_conflict_do_update(
        constraint=m.__table__.primary_key,
        set_=dict(paras=insert.excluded.paras, vectors=insert.excluded.vectors)
    ))
    sess.commit()

    # recurse to handle any other users with missing cache_{method}. Real return (empty object)
    # handled at top.
    return nlp_on_rows_(method, None, job_id, sess, uids)


def nlp_on_rows(method, id, job_id):
    for_entries = method == 'entries'
    with session() as sess:
        uids = nlp_on_rows_(method, id, job_id, sess, set())

        # profiles doesn't use uids, but create 1-el array to iterate anyway
        if not for_entries: uids = [None]

        for i, uid in enumerate(uids):
            uid = str(uid)
            gen_keywords(for_entries, uid, sess)

            if for_entries:
                # Then add a book job for every user who was affected. Delay by x minutes per
                # job (jobs are pruned by updated_at < ?, so posting to the future)
                # 9131155e: only update every x entries
                future = datetime.utcnow() + timedelta(minutes=i*3)
                sess.add(M.Job(
                    method='books',
                    data_in={'args': [uid]},
                    created_at=future,
                    updated_at=future,
                ))
                sess.commit()
            else:
                match_profiles(sess)
        return {}


def gen_keywords(for_entries, uid, sess):
    # finalize cache_entries by generating keywords. Need to do this last so
    # we can generate bigrams of full user corpus of paras (not per-entry)
    if for_entries:
        m, col = M.CacheEntry, M.CacheEntry.entry_id
        # generate bigrams within a user's entry-corpus
        rows = sess.query(m)\
            .options(sa.orm.load_only(col, m.paras))\
            .join(M.Entry, M.Entry.id == col)\
            .filter(M.Entry.user_id==uid, sa.func.array_length(m.paras, 1)>0)\
            .all()
    else:
        m, col = M.CacheUser, M.CacheUser.user_id
        # Generate bigrams across user profiles
        rows = sess.query(m)\
            .options(sa.orm.load_only(col, m.paras))\
            .filter(sa.func.array_length(m.paras, 1) > 0)\
            .all()
    if not rows: return
    paras_flat = [p for row in rows for p in row.paras]
    keywords = CleanText(paras_flat) \
        .keywords(postags=['NOUN', 'ADJ', 'VERB', 'PROPN'], bigram_min_count=2, bigram_threshold=2) \
        .join().value()
    for r in rows:
        ct = len(r.paras)
        kw = keywords[:ct]
        keywords = keywords[ct:]  # unshift for continuation
        r.clean = kw
    sess.commit()


def f32(arr):
    # psql loads float64, high-compute
    return np.array(arr).astype(np.float32)


def mean_(vecs):
    if type(vecs) == pd.Series:
        # coming in from pd.groupby.agg. Can't return np.array
        vecs = vecs.dropna()  # TODO why any nans?
        return f32(np.vstack(vecs)).mean(axis=0).tolist()
    return f32(vecs).mean(axis=0)


def match_profiles(sess):
    df = pd.read_sql("""
    select e.user_id, c.vectors from cache_entries c
    inner join entries e on e.id=c.entry_id
    where array_length(c.vectors, 1) > 0
    """, sess.bind)
    if not df.shape[0]: return

    # flatten multi-paragraph entries
    df['vectors'] = df.vectors.apply(mean_)
    # then mean the semantic of all entries for this user.
    # TODO cluster or something, just mean-ing all their entries is stupid
    df = df.groupby(['user_id']).vectors.agg(mean_)

    uids = df.index.tolist()
    vecs_entries = np.vstack(df.values)

    # TODO add community (M.User.public == True)
    df = pd.read_sql("""
    select c.user_id, c.vectors from cache_users c
    inner join users u on c.user_id=u.id 
    where u.therapist=true and c.vectors is not null 
    """, sess.bind)
    if not df.shape[0]: return
    match_ids = df.user_id.tolist()
    # This on the other hand is OK to mean, it's just their profile
    vecs_profiles = np.vstack(df.vectors.apply(mean_).values)

    logger.info(f"Compute distances")
    dists = Similars(vecs_entries, vecs_profiles).normalize().cosine(abs=True).value()

    sess.execute(text("""
    delete from profile_matches where user_id in :uids
    """), dict(uids=tuple(uids)) )
    sess.commit()

    # everything is in same order at this point
    sess.bulk_save_objects([
        M.ProfileMatch(user_id=uid, match_id=mid, score=dists[i,j])
        for i, uid in enumerate(uids)
        for j, mid in enumerate(match_ids)
    ])
    sess.commit()


def entries(eid, job_id=None):
    return nlp_on_rows('entries', str(eid), job_id)


def profiles(uid, job_id=None):
    logger.warning("Skipping profile-matching (re-doing this)")
    return {}
    return nlp_on_rows('profiles', str(uid), job_id)
