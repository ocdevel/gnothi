import logging
from sentence_transformers import SentenceTransformer
from sentence_transformers.util import semantic_search, community_detection
from store.store import EntryStore, embed
from common.util import fix_np

def search(data):
    query = data.get('query', '')
    entry_ids = data['entry_ids']
    user_id = data['user_id']
    search_threshold = data.get('search_threshold', .5)
    community_threshold = data.get('community_threshold', .75)
    no_response = dict(
        search_mean=None,
        ids=[],
        clusters=[]
    )
    if not entry_ids and not query:
        logging.warning("No entry_ids|query provided")
        return no_response

    entry_store = EntryStore(user_id)
    # TODO use PyArrow partitioning for entry_id as filename, rather than scanning column
    df_user = entry_store.load(entry_store.dir_paras, [
        # ("obj_type", "=", "paragraph"),
        ("obj_id", "in", entry_ids)
    ])
    if not df_user.shape[0]:
        return no_response
    # TODO sort by created_at

    # 72fc4837 - queryclassifier. Just using '?' in QA lambda

    if not query:
        pass
    elif len(query.split()) < 2:
        # TODO: BM25 retriever
        df_user = df_user[df_user.content.contains(query, case=False, regex=False)]
    else:
        # TODO add ANNLite, this is brute-force approach
        query_emb = embed([query])
        search_res = semantic_search(
            query_embeddings=fix_np(query_emb),
            corpus_embeddings=fix_np(df_user.embedding.values),
            top_k=50,
            corpus_chunk_size=100
        )
        idx_order = [
            r['corpus_id']
            for r in search_res[0]
            if r['score'] > search_threshold
        ]
        df_user = df_user.iloc[idx_order]

    if not df_user.shape[0]:
        return no_response

    # now narrowed by search
    corpus_filtered = fix_np(df_user.embedding.values, to_torch=True)
    clusters = community_detection(
        corpus_filtered,
        threshold=community_threshold,
        min_community_size=2
    )
    clusters = [
        [
            df_user.iloc[idx].obj_id
            for idx in clust
        ]
        for clust in clusters
    ]

    # Normalize orig_id since Paragraph.orig_id == entry_id, aka same for all
    # paragraphs in one entry
    ids = df_user.obj_id.unique().tolist()

    # send back, used for books / groups matching
    search_mean = df_user.embedding.mean(axis=0).tolist()
    result = dict(
        ids=ids,
        clusters=clusters,
        search_mean=search_mean
    )

    return result
