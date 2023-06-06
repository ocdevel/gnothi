import {
  pgTable,
  index,
  varchar,
  uuid,
  timestamp,
  date,
  boolean,
  integer,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import {InferModel} from 'drizzle-orm'

import {idCol, tsCol} from './utils'

export const users = pgTable('users', {
  // core
  id: idCol(),
  email: varchar("email", {length: 320}).notNull(),
  cognito_id: varchar("cognito_id"),
  created_at: tsCol("created_at"),
  updated_at: tsCol("updated_at"),

  // profile & settings
  username: varchar("username"),
  first_name: varchar("first_name"),
  last_name: varchar("last_name"),
  gender: varchar("gender"),
  orientation: varchar("orientation"),
  birthday: date("birthday"),
  timezone: varchar("timezone"),
  bio: varchar("bio"),
  // the default search filter for start date, in days. Null by default for now, but we may consider
  // the start of Gnothi time, like "2019-01-01"
  filter_days: integer("filter_days"),

  // admin
  is_superuser: boolean("is_superuser").default(false),
  is_cool: boolean("is_cool").default(false),
  therapist: boolean("therapist").default(false),
  n_tokens: integer("n_tokens").default(0),

  // ML
  ai_ran: boolean("ai_ran").default(false),
  last_books: timestamp("last_books", {withTimezone: true}),
  last_influencers: timestamp("last_influencers", {withTimezone: true}),

  // habitica
  habitica_user_id: varchar("habitica_user_id"),
  habitica_api_token: varchar("habitica_api_token"),

  // compliance
  accept_terms_conditions: timestamp("accept_terms_conditions"),
  accept_disclaimer: timestamp("accept_disclaimer"),
  accept_privacy_policy: timestamp("accept_privacy_policy"),

  // payments
  premium: boolean("premium").default(false),
  // This is duplicated from the payments table. This just affords us better performance
  payment_id: varchar("payment_id")

  // ws_id = sa.Column(sa.Unicode, index=True)
  // as = FKCol('users.id')
}, (t) => {
  return {
    ix_users_last_books: index("ix_users_last_books").on(t.last_books),
    ix_users_last_influencers: index("ix_users_last_influencers").on(t.last_influencers),
    ix_users_cognito_id: uniqueIndex("ix_users_cognito_id").on(t.cognito_id),
    ix_users_created_at: index("ix_users_created_at").on(t.created_at),
    ix_users_updated_at: index("ix_users_updated_at").on(t.updated_at),
    ix_users_username: uniqueIndex("ix_users_username").on(t.username),
    ix_users_email: uniqueIndex("ix_users_email").on(t.email),
    ix_users_payment_id: index("ix_users_payment_id").on(t.payment_id),
  }
})

export const userId = (col="user_id") => uuid(col).notNull().references(() => users.id, {onDelete: 'cascade'})

export type User = InferModel<typeof users>


// TODO keeping some old auth stuff on hand for a bit, just until I'm happy the migration went smoothly.
// Afterwards, delete the table.
export const authOld = pgTable('auth_old', {
  id: userId('id').primaryKey(),
  email: varchar('email', {length: 320}).notNull(),
  hashed_password: varchar('hashed_password').notNull(),
  updated_at: tsCol('updated_at')
}, table => ({
  ix_auth_old_email: uniqueIndex("ix_auth_old_email").on(table.email),
  ix_auth_old_updated_at: index("ix_auth_old_updated_at").on(table.updated_at),
}))
