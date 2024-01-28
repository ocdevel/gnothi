import {
  integer,
  varchar,
  pgTable,
  index, pgEnum, doublePrecision, primaryKey,
} from 'drizzle-orm/pg-core'
import {InferSelectModel} from "drizzle-orm"
import {idCol, tsCol} from './utils'
import {userId} from './users'

export const shelves = pgEnum('shelves', [
  'ai',
  'cosine',
  'like',
  'already_read',
  'dislike',
  'remove',
  'recommend'
])

export const bookshelf = pgTable('bookshelf', {
  created_at: tsCol("created_at"),
  updated_at: tsCol("updated_at"),
  book_id: integer('book_id').notNull(),
  user_id: userId(),
  shelf: shelves("shelf").notNull(),
  score: doublePrecision('score')

}, (table) => {
  return {
    bookshelf_pkey: primaryKey({
      name: "bookshelf_pkey",
      columns: [table.book_id, table.user_id]
    }),
    ix_bookshelf_created_at: index("ix_bookshelf_created_at").on(table.created_at),
    ix_bookshelf_updated_at: index("ix_bookshelf_updated_at").on(table.updated_at),
  }
})

export type BookshelfSelect = InferSelectModel<typeof bookshelf>
