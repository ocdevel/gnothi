from common.env import USE_GPU
import pandas as pd
from behaviors.db import engine
from transformers import pipeline

pipe = None

def main(event, context):
    global pipe
    if pipe is None:
        pipe = pipeline(task="table-question-answering", model="google/tapas-base-finetuned-wtq")

    uid, query = event['user_id'], event['query']
    with engine.connect() as conn:
        table = pd.read_sql("""
        SELECT f.name, 
        fe.created_at::DATE::VARCHAR AS "date", 
        fe.value::VARCHAR AS "value"
        FROM field_entries2 AS fe
        JOIN fields AS f ON f.id = fe.field_id
        WHERE fe.user_id = %(uid)s
        ORDER BY fe.created_at DESC
        LIMIT 1000
        """, conn, params={'uid': uid})
        print(table.shape)
        res = pipe(table=table, query=query)
    print(res)
    return {'answer': res['cells'][0]}