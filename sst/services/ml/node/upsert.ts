import {weaviateClient, weaviateDo} from "../../data/weaviate";
import {Entry} from '@gnothi/schemas/entries'

export async function upsert(entry: Entry) {
  const entryAsDoc = {
    name: entry.title || entry.text.slice(0, 140),
    content: entry.text,
    obj_id: entry.id,
    parent_id: entry.user_id
  }

  return await weaviateDo(weaviateClient.data
    .creator()
    .withClassName("Object")
    .withProperties(entryAsDoc)
  )
}
