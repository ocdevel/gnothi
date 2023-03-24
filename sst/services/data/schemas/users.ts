import {
  pgTable,
  index,
  varchar,
  uuid,
  timestamp,
  date,
  boolean,
  integer
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().notNull().primaryKey(),
  email: varchar("email", {length: 320}).notNull(),
  cognito_id: varchar("cognito_id"),
  created_at: timestamp("created_at", {withTimezone: true}).defaultNow(),
  updated_at: timestamp("updated_at", {withTimezone: true}).defaultNow(),
  username: varchar("username"),
  first_name: varchar("first_name"),
  last_name: varchar("last_name"),
  gender: varchar("gender"),
  orientation: varchar("orientation"),
  birthday: date("birthday"),
  timezone: varchar("timezone"),
  bio: varchar("bio"),
  is_superuser: boolean("is_superuser").default(false),
  is_cool: boolean("is_cool").default(false),
  therapist: boolean("therapist").default(false),
  n_tokens: integer("n_tokens").default(0),
  affiliate: varchar("affiliate"),
  ai_ran: boolean("ai_ran").default(false),
  last_books: timestamp("last_books", {withTimezone: true}),
  last_influencers: timestamp("last_influencers", {withTimezone: true}),
  habitica_user_id: varchar("habitica_user_id"),
  habitica_api_token: varchar("habitica_api_token")
}, (t) => {
  return {
    ix_users_last_books: index("ix_users_last_books").on(t.last_books),
    ix_users_last_influencers: index("ix_users_last_influencers").on(t.last_influencers),
    ix_users_cognito_id: index("ix_users_cognito_id").on(t.cognito_id),
    ix_users_created_at: index("ix_users_created_at").on(t.created_at),
    ix_users_updated_at: index("ix_users_updated_at").on(t.updated_at),
    ix_users_username: index("ix_users_username").on(t.username),
    ix_users_email: index("ix_users_email").on(t.email),
  }
})
