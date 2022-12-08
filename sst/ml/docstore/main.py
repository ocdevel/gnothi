from docstore.docstore import store
from docstore.search import search
from docstore.upsert import upsert

def main(event, context):
    data = event["data"]
    event = event["event"]
    final = {"statusCode": 200}
    if event == 'init':
        store.initialize()
        return final
    if event == "upsert":
        store.upsert_entries(data)
        return final
    if event == 'search':
        """
        data = {
            query: str. If None, return
            ids: [str, ..str] | None. If None, all entries go
        }
        """
        ids = data.get('ids', [])
        query = data.get('query', "")
        res = search(query, ids)
        return {"statusCode": 200, "answer": res["answer"], "ids": res["ids"]}

    return {"statusCode": 400, "data": f"event {event} not implemented"}
