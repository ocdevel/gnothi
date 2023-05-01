import {
  pgTable,
  index,
  text,
  integer,
  date,
  varchar,
  uuid,
  pgEnum,
  doublePrecision,
  timestamp,
  json,
  primaryKey,
} from 'drizzle-orm/pg-core';
import {InferModel} from "drizzle-orm"
import {users, userId} from './users'
import {idCol, tsCol} from './utils'

export const aistate = pgEnum('aistate', ['todo', 'skip', 'running', 'done'])

export const entries = pgTable('entries', {
  id: idCol(),
  created_at: tsCol('created_at'),
  updated_at: tsCol('updated_at'), // TODO
  n_notes: integer("n_notes").default(0),
  // Title optional, otherwise generated from text. topic-modeled, or BERT summary, etc?
  title: varchar("title"),
  text: varchar("text").notNull(),
  text_clean: varchar("text_clean"),
  text_paras: varchar("text_paras").array(),

  ai_index_state: aistate("ai_index_state").default('todo'),
  ai_summarize_state: aistate("ai_summarize_state").default('todo'),
  ai_title: varchar("ai_title"),
  ai_text: varchar("ai_text"),
  ai_sentiment: varchar("ai_sentiment"),
  ai_keywords: varchar("ai_keywords").array(),

  user_id: uuid('user_id').notNull().references(() => users.id, {onDelete: 'cascade'}),
}, (table) => {
  return {
    ix_entries_user_id: index("ix_entries_user_id").on(table.user_id),
    ix_entries_created_at: index("ix_entries_created_at").on(table.created_at),
    ix_entries_updated_at: index("ix_entries_updated_at").on(table.updated_at),
  }
})

export type Entry = InferModel<typeof entries>
