from docstore.nodes import nodes
import logging
from sentence_transformers.util import semantic_search, community_detection
from docstore.docstore import EntryStore, BookStore, to_tensor

book_store = BookStore()

def search(query, user_id, entry_ids):
    """
    :return {answer: str, ids: str[], books: Book[], groups: Group[]}
    """""
    no_response = dict(
        answer="",
        ids=[],
        books=[],
        groups=[]
    )
    if not entry_ids and not query:
        logging.warning("No entry_ids|query provided")
        return no_response

    entry_store = EntryStore(user_id)
    df_user = entry_store.load([
        ("obj_type", "=", "paragraph"),
        ("obj_id", "in", entry_ids)
    ])
    if not df_user.shape[0]:
        return no_response
    # TODO sort by createdj_at

    query_classifier = nodes.query_classifier()
    dense_retriever = nodes.dense_retriever()
    qa_reader = nodes.qa_reader()

    # https://haystack.deepset.ai/tutorials/01_basic_qa_pipeline
    query_class = query_classifier.run(query)

    if not query:
        pass
    elif len(query.split()) < 2:
        # TODO: BM25 retriever
        df_user = df_user[df_user.content.contains(query, case=False, regex=False)]
    else:
        # TODO add ANNLite, this is brute-force approach
        query_emb = dense_retriever.embed_queries([query])
        search_res = semantic_search(
            query_embeddings=query_emb,
            corpus_embeddings=to_tensor(df_user.embedding),
            top_k=50,
            corpus_chunk_size=100
        )
        idx_order = [
            r['corpus_id']
            for r in search_res[0]
            if r['score'] > .5
        ]
        df_user = df_user.iloc[idx_order]

    if not df_user.shape[0]:
        return no_response

    search_mean = df_user.embedding.mean(axis=0)
    # now narrowed by search
    corpus_filtered = to_tensor(df_user.embedding)
    themes = community_detection(corpus_filtered, threshold=.75, min_community_size=2)
    # TODO do something with themes

    # Haystack stuff
    docs = entry_store.entries_to_haystack(df_user.to_dict("records"))

    if query_class[1] == 'output_1':
        res = qa_reader.predict(
            query=query,
            documents=docs,
            top_k=2,
        )
        # answer = tup[0]['answers'][0].answer  # from .run()
        answer = res['answers'][0]
    else:
        answer = ""

    # Books
    books = book_store.search(search_mean)

    # Normalize orig_id since Paragraph.orig_id == entry_id, aka same for all
    # paragraphs in one entry
    ids = df_user.obj_id.unique().tolist()

    result = dict(
        answer=answer,
        ids=ids,
        books=books,
        groups=[]
    )

    return result
