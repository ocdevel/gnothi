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
  connection_id: varchar('connection_id').notNull().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id, {onDelete: 'cascade'}),
}, (table) => {
  return {
    ix_ws_connections_user_id: index("ix_ws_connections_user_id").on(table.user_id),
  }
})
