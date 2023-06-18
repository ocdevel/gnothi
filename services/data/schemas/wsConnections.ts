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
import {InferModel} from 'drizzle-orm'
import {tsCol} from './utils'
import {users} from './users'

export const wsConnections = pgTable('ws_connections', {
  connection_id: varchar('connection_id').notNull().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id, {onDelete: 'cascade'}),
  // We'll purge orphaned connections periodically
  created_at: tsCol("created_at")
}, (table) => {
  return {
    ix_ws_connections_user_id: index("ix_ws_connections_user_id").on(table.user_id),
    ix_ws_connections_connection_id: index("ix_ws_connections_connection_id").on(table.connection_id),
    ix_ws_connections_created_at: index("ix_ws_connections_created_at").on(table.created_at),
  }
})

export type WsConnection = InferModel<typeof wsConnections>
