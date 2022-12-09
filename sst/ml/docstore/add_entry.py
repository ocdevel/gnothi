import os, json
import numpy as np
from typing import List, Dict, Optional
import boto3
from docstore.docstore import store
from docstore.nodes import nodes
from common.preprocess import CleanText

region = os.getenv("REGION", "us-east-1")
summarize_fn = os.getenv(
    "summarize_fn",
    "arn:aws:lambda:us-east-1:488941609888:function:legionwin-gnothi-Ml-fnsummarize13BA0EC4-GupxhnRgBiDo"
)
lambda_client = boto3.client("lambda", region_name=region)

def summarize(text: str):
    Payload = [
        {
            "text": text,
            "params": {"summarize": {"min_length": 20, "max_length": 80}}
        }, 
        {
            "text": text,
            "params": {
                "summarize": {"min_length": 100, "max_length": 300},
                "keywords": {"top_n": 5},
                "emotion": True
            }
        }
    ]
    response = lambda_client.invoke(
        FunctionName=summarize_fn,
        InvocationType='RequestResponse',
        Payload=bytes(json.dumps(Payload), encoding='utf-8')
    )
    return json.loads(response['Payload'].read())

def entry_to_haystack(entry):
    return dict(
        name=entry['title'] or entry['text'][:128],
        content=entry['text'],
        id=entry['id'],
        orig_id=entry['id'],
        text_summary="",
        title_summary=""
    )

def add_entry(entry):
    # manually encode here because WeaviateDocumentStore will write document with np.rand,
    # then you re-fetch the document and update_embeddings()
    retriever = nodes.embedding_retriever(batch_size=8)
    embed = retriever.embedding_encoder.embed

    eid, text = entry['id'], entry['text']

    # Convert text into paragraphs
    print("Cleaning entry, converting to paragraphs")
    paras = CleanText([text]).markdown_split_paragraphs().value()
    if not paras:
        raise "No paragraphs, fix this! See entries_profiles.py"
    text = " ".join(paras)  # now clean of markdown, grouped cleanly

    # Summarize
    print("Summarizing entry")
    summaries = summarize(text)
    title = summaries[0]['summary']
    summary, keywords, emotion = summaries[1]['summary'], summaries[1]['keywords'], summaries[1]['emotion']

    # Embed
    print("Embedding entry")
    embeddings = embed(paras)

    # Aggregate
    paras = [dict(
        # id=eid,  # wouldn't be unique. We'll filter via orig_id
        orig_id=eid,
        content=p,
        embedding=embeddings[i]
    ) for i, p in enumerate(paras)]

    # Save paras to weaviate
    print("Saving paragraphs to Weaviate")
    store.document_store.delete_documents(
        index="Paragraph",
        filters={"orig_id": eid}
    )
    store.document_store.write_documents(
        index="Paragraph",
        documents=paras,
    )

    # Save entry with the paragraphs
    print("Saving entry to weaviate")
    mean = np.mean(
        [p['embedding'] for p in paras],
        axis=0
    )
    store.document_store.write_documents(
        index="Entry",
        documents=[dict(
            id=eid, # haystack will upsert if exists
            orig_id=eid,
            content=text,
            embedding=mean
        )]
        # TODO use ref2vec-centroid instead of manual mean
        # https://github.com/semi-technologies/weaviate-examples/blob/main/getting-started-with-python-client-colab/Getting_Started_With_Weaviate_Python_Client.ipynb
    )

    result = {
        'title': title,
        'summary': summary,
        'keywords': keywords,
        'emotion': emotion
    }
    print("Done with result:", result)
    return result
