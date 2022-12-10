from docstore.nodes import nodes
from docstore.docstore import store
import numpy as np
from uuid import uuid4

def search(query, ids):
    """
    :return {answer: str, ids: str[], books: Book[], groups: Group[]}
    """""
    no_response = dict(
        answer="",
        ids=[],
        books=[],
        groups=[]
    )
    if not ids and not query:
        return no_response

    store_ = store.document_store
    query_classifier = nodes.query_classifier()
    dense_retriever = nodes.dense_retriever()
    qa_reader = nodes.qa_reader()

    # https://haystack.deepset.ai/tutorials/01_basic_qa_pipeline
    query_class = query_classifier.run(query)

    id_filter = {"$or": [
        {"orig_id": id}
        for id in ids
    ]}

    if not query:
        docs = store_.query(
            filters=id_filter,
            index="Paragraph",
            top_k=len(ids)
        )
    elif len(query.split()) < 3:
        # BM25 retriever. Currently doesn't support filter+query in weaviate,
        # see pull request
        # docs = store.query(query=query, filters=id_filter)
        docs = store_.query(
            filters=id_filter,
            index="Paragraph",
            top_k=len(ids)
        )
    else:
        docs = dense_retriever.retrieve(
            query=query,
            document_store=store_,
            index="Paragraph",
            filters=id_filter,
            top_k=50
        )

    if not docs:
        return no_response

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

    # Normalize orig_id since Paragraph.orig_id == entry_id, aka same for all
    # paragraphs in one entry
    ids = list(set([doc.id for doc in docs]))

    search_mean = np.mean([
        doc.embedding
        for doc in docs
    ], axis=0)

    # Books
    books = store_.query_by_embedding(
        query_emb=search_mean,
        index="Book",
        top_k=20,
        return_embedding=False
    )
    books = [
        dict(
            id=str(uuid4()),  # TODO use ASIN or whatever
            name=d.meta['name'],
            content=d.content,
            genre=d.meta['genre'],
            author=d.meta['genre'],
            score=d.score
        )
        for d in books
    ]

    result = dict(
        answer=answer,
        ids=ids,
        books=books,
        groups=[]
    )

    return result
