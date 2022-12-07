from common import nodes
from document_store import store

def search(query, ids):
    if not query:
        return {"ids": [], "answer": ""}

    # https://haystack.deepset.ai/tutorials/01_basic_qa_pipeline
    query_class = nodes.query_classifier.run(query)
    docs = nodes.embedding_retriever.retrieve(
        query=query,
        document_store=store.document_store,
        filters={
          "$or": [
              {"id": id}
              for id in ids
          ]
        },
        top_k=50
    )
    print("docs", docs)
    if query_class[1] == 'output_1':
        tup = nodes.farm_reader.run(
            query=query,
            documents=docs,
            top_k=2,
        )
        print("answers", tup)
        answer = tup[0]['answers'][0].answer  # .score
        print(query, answer)
    else:
        answer = ""

    result = {
        "answer": answer,
        "ids": [doc.id for doc in docs]
    }

    # # Change `minimum` to `medium` or `all` to raise the level of detail
    # print_answers(result, details="all")
    return result
