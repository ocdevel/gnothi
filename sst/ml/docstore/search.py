from docstore.nodes import nodes
from docstore.docstore import store

def search(query, ids):
    if not query:
        return {"ids": [], "answer": ""}

    query_classifier = nodes.query_classifier()
    embedding_retriever = nodes.embedding_retriever()
    farm_reader = nodes.farm_reader()

    # https://haystack.deepset.ai/tutorials/01_basic_qa_pipeline
    query_class = query_classifier.run(query)
    docs = embedding_retriever.retrieve(
        query=query,
        document_store=store.document_store,
        index="Paragraph",
        filters={
          "$or": [
              {"orig_id": id}
              for id in ids
          ]
        },
        top_k=50
    )
    print("docs", docs)
    if query_class[1] == 'output_1':
        tup = farm_reader.run(
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
