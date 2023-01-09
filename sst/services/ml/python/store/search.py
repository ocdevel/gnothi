import logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

from sentence_transformers.util import semantic_search
from store.cluster import cluster
from store.store import EntryStore, embed
from common.util import fix_np


def search(data):
    query = data.get('query', '')
    entry_ids = data['entry_ids']
    user_id = data['user_id']
    search_threshold = data.get('search_threshold', .5)
    no_response = dict(
        search_mean=None,
        ids=[],
        clusters=[]
    )
    if not entry_ids and not query:
        logger.warning("No entry_ids|query provided")
        return no_response

    logger.info("Loading entries")
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

    n_b4 = df_user.shape[0]
    if not query:
        logger.info("No query, skipping search")
        pass
    elif len(query.split()) < 2:
        # TODO: BM25 retriever
        logger.info(f"Simple query, text-match")
        df_user = df_user[df_user.content.str.contains(query, case=False, regex=False)]
    else:
        n_before = df_user.shape[0]
        # TODO add ANNLite, this is brute-force approach
        logger.info("Complex query, running semantic search")
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
    logger.info(f"n_before:{n_b4} n_after:{df_user.shape[0]}")

    if not df_user.shape[0]:
        return no_response

    # now narrowed by search
    logger.info("Running clustering")
    corpus_filtered = fix_np(df_user.embedding.values, to_torch=False)
    centroids, labels = cluster(
        corpus_filtered,
        algo='kmeans-guess'
    )
    clusters = [
        [
            df_user.iloc[idx].obj_id
            for idx in label
        ]
        for label in labels
    ]

    # Normalize orig_id since Paragraph.orig_id == entry_id, aka same for all
    # paragraphs in one entry
    ids = df_user.obj_id.unique().tolist()

    # send back, used for books / groups matching
    search_mean = df_user.embedding.mean(axis=0).tolist()
    logger.info("Returning results")
    result = dict(
        ids=ids,
        clusters=clusters,
        search_mean=search_mean
    )

    return result
