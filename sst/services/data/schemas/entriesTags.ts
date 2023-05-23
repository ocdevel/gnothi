import {tagId, tags} from './tags'
import {entries, entryId} from './entries'
import {InferModel} from 'drizzle-orm'
import {
  pgTable,
  uuid,
  primaryKey
} from 'drizzle-orm/pg-core';


export const entriesTags = pgTable('entries_tags', {
  entry_id: entryId(),
  tag_id: tagId(),

}, (t) => {
  return {
    pk: primaryKey(t.entry_id, t.tag_id)
  }
})


export type EntryTag = InferModel<typeof entriesTags>
