import {userId, users} from './users'
import {
  pgTable,
  index,
  varchar,
  uuid,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core';
import {entries, entryId} from './entries'
import {InferModel} from 'drizzle-orm'
import {idCol, tsCol} from "./utils";

// TODO bring in notes_notifs

export const notetypes = pgEnum('notetypes', [
  'label',
  'note',
  'resource',
  'comment'
])

export const notes = pgTable('notes', {
  id: idCol(),
  created_at: tsCol("created_at"),
  entry_id: entryId(),
  user_id: userId(),
  type: notetypes('type').notNull().default("note"),
  text: varchar('text').notNull(),
  private: boolean('private').default(false),
}, (t) => {
  return {
    ix_notes_created_at: index("ix_notes_created_at").on(t.created_at),
    ix_notes_entry_id: index("ix_notes_entry_id").on(t.entry_id),
    ix_notes_user_id: index("ix_notes_user_id").on(t.user_id),
  }
})

export type Note = InferModel<typeof notes>
