from common.env import VECTORS_PATH
from docstore.nodes import nodes
import torch
import numpy as np
import os
from uuid import uuid4
import logging
import pandas as pd
import pyarrow as pa
from pyarrow import parquet
from sentence_transformers.util import semantic_search, community_detection
from haystack import Document


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

    user_file = f"{VECTORS_PATH}/{user_id}/entries.parquet"
    if not os.path.exists(user_file):
        logging.warning(f"{user_file} doesn't exist")
        return no_response
    df_user = parquet.read_table(
        user_file,
        filters=[
            ("obj_type", "=", "paragraph"),
            ("obj_id", "in", entry_ids)
        ]
    ).to_pandas()
    # TODO sort by created_at

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
        # revisit: when getting directly, ValueError: setting an array element with a sequence.
        search_res = semantic_search(
            query_embeddings=query_emb,
            corpus_embeddings=torch.tensor(df_user.embedding.tolist(), device="cpu"),
            top_k=50,
            corpus_chunk_size=100
        )
        idx_order = [r['corpus_id'] for r in search_res[0]]
        df_user = df_user.iloc[idx_order]

    if not df_user.shape[0]:
        return no_response

    search_mean = df_user.embedding.mean(axis=0)
    # now narrowed by search
    corpus_filtered = torch.tensor(df_user.embedding.tolist(), device="cpu")
    themes = community_detection(corpus_filtered, threshold=.75, min_community_size=2)
    # TODO do something with themes

    # Haystack stuff
    docs = [
        Document(
            id=d['id'],
            content=d['content'],
            meta={
                'obj_id': d['obj_id'],
                'obj_type': d['obj_type'],
                'created_at': d['created_at']
            },
            embedding=d['embedding']
        )
        for d in df_user.to_dict("Records")
    ]

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
    # FIXME
    books = pd.read_pickle(f"{VECTORS_PATH}/books/embeddings.pkl")

    # revisit: when getting directly, ValueError: setting an array element with a sequence.
    corpus_books = torch.tensor(books.embedding, device='cpu')
    docs = semantic_search(
        query_embeddings=search_mean,
        corpus_embeddings=corpus_books,
        top_k=50,
        corpus_chunk_size=100
    )
    idx_order = [d['corpus_id'] for d in docs[0]]
    books = books.iloc[idx_order]

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
