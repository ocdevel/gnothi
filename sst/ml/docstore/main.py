# Immediately set transformers cache path
import common.env

from docstore.search import search
from docstore.add_entry import add_entry

VEC_VERSION = 1

def main(event, context):
    data = event["data"]
    event = event["event"]
    final = {"statusCode": 200}
    if event == "upsert":
        return add_entry(data)
    if event == 'search':
        res = search(data.get('query', ''), data['user_id'], data['entry_ids'])
        return {
            "statusCode": 200,
            "answer": res["answer"],
            "ids": res["ids"],
            "books": res.get("books", []),
            "groups": res.get("groups", [])
        }

    return {"statusCode": 400, "data": f"event {event} not implemented"}
