import weaviate
import json

# client = weaviate.Client("https://some-endpoint.semi.network/") # <== if you use the WCS
# or
client = weaviate.Client("http://localhost:8080") # <== if you use Docker-compose

client.schema.delete_all()

schema = client.schema.get()
print(json.dumps(schema))

# we will create the class "Author" and the properties
# from the basics section of this guide
class_object = {
    "class": "Object", # <= note the capital "A".
    "description": "Individual entry embeddings",
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
            "description": "UUID of the object",
            "name": "obj_id",
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
                "text"
            ],
            "description": "The body content",
            "name": "text"
        }
        # TODO consider adding user-manual title/summary
    ]
}
class_book = {
    "class": "Book",
    "description": "Book embeddings",
    "properties": [
        {
            "dataType": [
                "string"
            ],
            "description": "Some universal id on book",
            "name": "obj_id",
        },
        {
            "dataType": [
                "text"
            ],
            "description": "The body content",
            "name": "text"
        }
        # TODO consider adding user-manual title/summary
    ]
}

# add the schema
client.schema.create_class(class_object)
client.schema.create_class(class_book)

# get the schema
schema = client.schema.get()

# print the schema
print(json.dumps(schema, indent=4))

properties = {
    "parent_id": "user-1",
    "obj_id": "entry-1",
    "obj_type": "entry",
    "text": "This is my first entry, it should be embedded properly.",
  }

client.data_object.create(properties, "Object") #, uuid, vector)
