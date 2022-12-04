import weaviate from 'weaviate-client'

const client = weaviate.client({
  scheme: 'http',
  host: 'localhost:8080'
})

async function promiseDo(whatever) {
  return new Promise((resolve, reject) => {
  whatever.do()
    .then((res) => resolve(res))
    .catch(err => {
      console.error(err)
      resolve({})
      // reject(err)
    })
  })
}

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
  await promiseDo(client.schema
    .classDeleter()
    .withClassName("Object")
  )
  await promiseDo(client.schema
    .classCreator()
    .withClass(classes[0])
  )
}
