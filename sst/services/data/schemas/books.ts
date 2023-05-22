import {
  integer,
  varchar,
  pgTable,
  index,
} from 'drizzle-orm/pg-core'
import {InferModel} from "drizzle-orm"

export const books = pgTable('books', {
  id: integer('id').notNull().primaryKey(),
  title: varchar('title').notNull(),
  text: varchar('text').notNull(),
  author: varchar('author'),
  topic: varchar('topic'),
  thumbs: integer('thumbs').default(0),
  amazon: varchar('amazon'),
}, (table) => {
  return {
  }
})

export type Book = InferModel<typeof books>
