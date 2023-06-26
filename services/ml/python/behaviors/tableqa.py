from common.env import USE_GPU
import pandas as pd
from behaviors.db import engine
from transformers import TapexTokenizer, BartForConditionalGeneration

model = None
tokenizer = None

def main(event, context):
    global model
    global tokenizer
    if model is None:
        tokenizer = TapexTokenizer.from_pretrained("microsoft/tapex-base-finetuned-wtq")
        model = BartForConditionalGeneration.from_pretrained("microsoft/tapex-base-finetuned-wtq")

    uid, query = event['user_id'], event['query']
    with engine.connect() as conn:
        table = pd.read_sql("""
        SELECT f.name as "behavior", 
        fe.created_at::DATE::VARCHAR AS "date", 
        fe.value::INTEGER AS "value"
        FROM field_entries2 AS fe
        JOIN fields AS f ON f.id = fe.field_id
        WHERE fe.user_id = %(uid)s
        ORDER BY fe.created_at DESC
        LIMIT 1000 -- TODO we need a model which can handle longer inputs
        """, conn, params={'uid': uid})
    print(table.shape)
    encoding = tokenizer(table=table, query=query, return_tensors="pt", truncation=True)
    outputs = model.generate(**encoding)
    res = tokenizer.batch_decode(outputs, skip_special_tokens=True)
    print(res)
    return {'answer': res[0]}
