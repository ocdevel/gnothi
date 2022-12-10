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


def add_entry(entry):
    # manually encode here because WeaviateDocumentStore will write document with np.rand,
    # then you re-fetch the document and update_embeddings()
    retriever = nodes.dense_retriever(batch_size=8)
    embed = retriever.embedding_encoder.embed

    eid, text, uid = entry['id'], entry['text'], entry['user_id']

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
    # TODO if tokenize(text) < 300: summary = text
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
            parent_id=uid,
            content=text,
            embedding=mean
        )]
        # TODO use ref2vec-centroid instead of manual mean
        # https://github.com/semi-technologies/weav    client.data_object.reference.add(iate-examples/blob/main/getting-started-with-python-client-colab/Getting_Started_With_Weaviate_Python_Client.ipynb
    )

    entries = (store.weaviate_client.query.get(class_name="Entry")
        .with_additional(["vector"])
        .with_where({
            'path': ["parent_id"],
            'operator': "Equal",
            "valueString": uid
        })
        .do())
    entries = entries['data']['Get']['Entry']
    mean = np.mean([
        e['_additional']['vector']
        for e in entries
    ], axis=0)
    store.document_store.write_documents(
        index="User",
        documents=[dict(
            id=entry['user_id'],
            embedding=mean,
            content=""
        )]
    )

    result = {
        'title': title,
        'summary': summary,
        'keywords': keywords,
        'emotion': emotion
    }
    print("Done with result:", result)
    return result
