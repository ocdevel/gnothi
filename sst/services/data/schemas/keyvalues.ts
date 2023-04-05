import {
  InferModel,
  pgTable,
  varchar,
} from 'drizzle-orm/pg-core';

export const keyvalues = pgTable('keyvalues', {
  key: varchar("key").notNull().primaryKey(),
  value: varchar("value").notNull(),
})

export type Keyvalue = InferModel<typeof keyvalues>
