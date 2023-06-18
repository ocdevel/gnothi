from common.env import ENCODER_MODEL, ENCODER_DIM
from common.env import USE_GPU
from store.store import EntryStore
from transformers import pipeline, AutoTokenizer
import torch

from transformers import pipeline

# Load the model and tokenizer
# TODO try
# - distilbert-base-cased-distilled-squad - 512
# - mrm8488/bert-tiny-5-finetuned-squad2 - 512
model_name = "deepset/roberta-base-squad2"
tokenizer = AutoTokenizer.from_pretrained(model_name, model_max_length=386)

# Initialize the pipeline
nlp = pipeline('question-answering', model=model_name, tokenizer=tokenizer)


def main(event, context):
    query = event.get('query', '')
    if not query or not query.endswith("?"):
        return {"answer": ""}
    entry_ids = event['entry_ids']
    # prior filter resulted in no entries to ask
    if not entry_ids:
        return {"answer": ""}
    user_id = event['user_id']
    entry_store = EntryStore(user_id)
    df_paras = entry_store.load(entry_store.dir_paras, [
        # ("obj_type", "=", "paragraph"),
        ("obj_id", "in", entry_ids)
    ])
    contexts = df_paras.content.values.tolist()

    # process each context and get answer
    answers = []
    for context in contexts:
        result = nlp(question=query, context=context, truncation=True, padding=True)
        answers.append(result)

    # sort answers by score
    answers = sorted(answers, key=lambda x: x['score'], reverse=True)

    print(answers)
    answer = answers[0]['answer']
    # TODO return other attrs (score, context, etc)
    return {"answer": answer}
