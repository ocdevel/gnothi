import os, json
import boto3
from common.preprocess import CleanText
from docstore.docstore import  EntryStore

region = os.getenv("REGION", "us-east-1")
summarize_fn = os.getenv(
    "summarize_fn",
    "arn:aws:lambda:us-east-1:488941609888:function:legionwin3-gnothi-Ml-fnsummarize13BA0EC4-Ocv0FCykjbi7"
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
    store = EntryStore(entry['user_id'])
    text = entry['text']

    # Convert text into paragraphs
    print("Cleaning entry, converting to paragraphs")
    paras = (CleanText([text])
             .markdown_split_paragraphs()
             .value())
    if not paras:
        raise "No paragraphs, fix this! See entries_profiles.py"
    text = " ".join(paras)  # now clean of markdown, grouped cleanly

    # Summarize
    print("Summarizing entry")
    summaries = summarize(text)

    entry['title'] = summaries[0]['summary']
    entry['summary'] = summaries[1]['summary']
    entry['keywords'] = summaries[1]['keywords']
    entry['emotion'] = summaries[1]['emotion']

    print("Saving entry & paras to vector db")
    store.add_entry(entry, paras)

    print("Done with result:", entry)
    return entry
