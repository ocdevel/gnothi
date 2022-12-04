import {weaviateClient, weaviateDo} from '../weaviate'

const classes = [{
  "class": "Object",  // <= note the capital "O".
  "description": "Individual entry embeddings",
  "vectorIndexConfig": {
    "distance": "dot"
  },
  "properties": [
    {
      "dataType": [
        "string"
      ],
      "description": "UUID the owner (user, group, etc)",
      "name": "parent_id",
    },
    {
      "dataType": [
        "string"
      ],
      "description": "The object type. Eg, entry|user_centroid|user_center|group_centroid|group_center",
      "name": "obj_type"
    },
    {
      "dataType": [
        "string"
      ],
      "description": "Name / title",
      "name": "name"
    },
    {
      "dataType": [
        "text"
      ],
      "description": "The body content",
      "name": "content"
    }
    // TODO consider adding user-manual title/summary
  ]
  //, {
  //  "class": "Book",
  //  "description": "Book embeddings",
  //  "properties": [
  //    {
  //      "dataType": [
  //        "string"
  //      ],
  //      "description": "Some universal id on book",
  //      "name": "obj_id",
  //    },
  //    {
  //      "dataType": [
  //        "text"
  //      ],
  //      "description": "The body content",
  //      "name": "text"
  //    }
  //    # TODO consider adding user-manual title/summary
  //  ]
  //}]
}]
export async function initWeaviate() {
  await weaviateDo(weaviateClient.schema
    .classDeleter()
    .withClassName("Object"))
  await weaviateDo(weaviateClient.schema
    .classCreator()
    .withClass(classes[0]))
}
