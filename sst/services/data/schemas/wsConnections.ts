import {
  pgTable,
  index,
  varchar,
  uuid,
  timestamp,
  date,
  boolean,
  integer,
  primaryKey
} from 'drizzle-orm/pg-core';
import {users} from './users'

export const wsConnections = pgTable('ws_connections', {
  user_id: uuid('user_id').notNull().references(() => users.id, {onDelete: 'cascade'}),
  connection_id: varchar('connection_id').notNull(),
}, (table) => {
  return {
    pk: primaryKey(table.user_id, table.connection_id),
  }
})
