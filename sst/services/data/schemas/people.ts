  import {userId} from './users'

import { pgTable, index, varchar } from 'drizzle-orm/pg-core';
import {idCol} from './utils'

export const people = pgTable('people', {
  id: idCol(),
  name: varchar('name').notNull(),
  relation: varchar("relation"),
  issues: varchar("issues"),
  bio: varchar("bio"),
  user_id: userId(),
}, (table) => {
  return {
    ix_people_user_id: index("ix_people_user_id").on(table.user_id),
  }
})
