import {userId, users} from './users'
import {
  pgTable,
  index,
  varchar,
  uuid,
  timestamp,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';
import {InferModel} from 'drizzle-orm'
import {idCol} from "./utils";


export const tags = pgTable('tags', {
  id: idCol(),
  user_id: userId(),
  name: varchar("name").notNull(),
  created_at: timestamp("created_at", {withTimezone: true}).defaultNow(),

  // Save user's selected tags between sessions
  selected: boolean("selected").default(true),
  main: boolean("main").default(false),
  sort: integer("sort").default(0).notNull(),
  ai_index: boolean("ai_index").default(true),
  ai_summarize: boolean("ai_summarize").default(true),

}, (t) => {
  return {
    ix_tags_user_id: index("ix_tags_user_id").on(t.user_id),
    ix_tags_created_at: index("ix_tags_created_at").on(t.created_at),
  }
})

export type Tag = InferModel<typeof tags>

export const tagId = (col="tag_id") => uuid(col).notNull().references(() => tags.id, {onDelete: 'cascade'})
