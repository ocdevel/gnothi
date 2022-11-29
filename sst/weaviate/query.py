import weaviate
import json

# client = weaviate.Client("https://some-endpoint.semi.network/") # <== if you use the WCS
# or
client = weaviate.Client("http://localhost:8080") # <== if you use Docker-compose

# schema = client.schema.get()
# print(json.dumps(schema))

# properties = {
#     "parent_id": "user-1",
#     "obj_id": "entry-1",
#     "obj_type": "entry",
#     "text": "This is my first entry, it should be embedded properly.",
#   }

query = """
{
  Get {
    Object (
      where: {
        path: ["obj_id"]
        operator: Equal
        valueString: "entry-1"
      }
    ) {
      text
      _additional {
        vector
        summary(
          properties: ["summary"],
        ) {
          property
          result
        }
      }     
    }
  }
}
"""

result = client.query.raw(query)


print(result)
