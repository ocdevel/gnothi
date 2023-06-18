# Immediately set transformers cache path
import common.env

from store.search import search
from store.upsert import upsert

VEC_VERSION = 1

def main(event, context):
    data = event["data"]
    event = event["event"]
    if event == "upsert":
        return upsert(data)
    if event == 'search':
        return search(data)

    return {"statusCode": 400, "data": f"event {event} not implemented"}
