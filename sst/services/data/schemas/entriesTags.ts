import {tags} from './tags'
import {entries} from './entries'
import {InferModel} from 'drizzle-orm'
import {
  pgTable,
  uuid,
  primaryKey
} from 'drizzle-orm/pg-core';


export const entriesTags = pgTable('entries_tags', {
  entry_id: uuid('entry_id').notNull().references(() => entries.id, {onDelete: 'cascade'}),
  tag_id: uuid('tag_id').notNull().references(() => tags.id, {onDelete: 'cascade'}),

}, (t) => {
  return {
    pk: primaryKey(t.entry_id, t.tag_id)
  }
})


export type EntryTag = InferModel<typeof entriesTags>
