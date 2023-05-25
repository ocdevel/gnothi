import { sql } from "drizzle-orm"
import { pgTable, pgEnum, pgSchema, AnyPgColumn, index, foreignKey, uuid, varchar, serial, integer, doublePrecision, timestamp, boolean, json, jsonb, primaryKey, uniqueIndex, date } from "drizzle-orm/pg-core"

export const defaultvaluetypes = pgEnum("defaultvaluetypes", ['value', 'average', 'ffill'])
export const fieldtype = pgEnum("fieldtype", ['number', 'fivestar', 'check', 'option'])
export const machinetypes = pgEnum("machinetypes", ['gpu', 'server'])
export const notetypes = pgEnum("notetypes", ['label', 'note', 'resource'])
export const shelves = pgEnum("shelves", ['ai', 'like', 'already_read', 'dislike', 'remove', 'recommend', 'cosine'])


export const people = pgTable("people", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull().primaryKey(),
	name: varchar("name"),
	relation: varchar("relation"),
	issues: varchar("issues"),
	bio: varchar("bio"),
	user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
},
(table) => {
	return {
		ix_people_user_id: index("ix_people_user_id").on(table.user_id),
	}
});

export const books = pgTable("books", {
	id: integer("id").notNull().primaryKey(),
	title: varchar("title").notNull(),
	text: varchar("text").notNull(),
	author: varchar("author"),
	topic: varchar("topic"),
	thumbs: integer("thumbs").default(0),
	amazon: varchar("amazon"),
});

export const cacheEntries = pgTable("cache_entries", {
	entry_id: uuid("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" } ).primaryKey(),
	paras: varchar("paras").array(),
	clean: varchar("clean").array(),
	vectors: doublePrecision("vectors").array(),
});

export const cacheUsers = pgTable("cache_users", {
	user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ).primaryKey(),
	paras: varchar("paras").array(),
	clean: varchar("clean").array(),
	vectors: doublePrecision("vectors").array(),
});

export const fieldEntries = pgTable("field_entries", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull().primaryKey(),
	value: doublePrecision("value"),
	created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
	user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
	field_id: uuid("field_id").references(() => fields.id, { onDelete: "cascade" } ),
},
(table) => {
	return {
		ix_field_entries_created_at: index("ix_field_entries_created_at").on(table.created_at),
		ix_field_entries_user_id: index("ix_field_entries_user_id").on(table.user_id),
	}
});

export const tags = pgTable("tags", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull().primaryKey(),
	user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
	name: varchar("name").notNull(),
	created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
	selected: boolean("selected").default(true),
	main: boolean("main").default(false),
},
(table) => {
	return {
		ix_tags_created_at: index("ix_tags_created_at").on(table.created_at),
		ix_tags_user_id: index("ix_tags_user_id").on(table.user_id),
	}
});

export const machines = pgTable("machines", {
	id: varchar("id").notNull().primaryKey(),
	status: varchar("status"),
	created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
	updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
},
(table) => {
	return {
		ix_machines_created_at: index("ix_machines_created_at").on(table.created_at),
		ix_machines_updated_at: index("ix_machines_updated_at").on(table.updated_at),
	}
});

export const fields = pgTable("fields", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull().primaryKey(),
	type: fieldtype("type"),
	name: varchar("name"),
	created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
	excluded_at: timestamp("excluded_at", { withTimezone: true }).defaultNow(),
	default_value: defaultvaluetypes("default_value").default('value'),
	default_value_value: doublePrecision("default_value_value"),
	attributes: json("attributes"),
	service: varchar("service"),
	service_id: varchar("service_id"),
	user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
	influencer_score: doublePrecision("influencer_score").default(0),
	next_pred: doublePrecision("next_pred").default(0),
	avg: doublePrecision("avg").default(0),
},
(table) => {
	return {
		ix_fields_created_at: index("ix_fields_created_at").on(table.created_at),
		ix_fields_excluded_at: index("ix_fields_excluded_at").on(table.excluded_at),
		ix_fields_user_id: index("ix_fields_user_id").on(table.user_id),
	}
});

export const entries = pgTable("entries", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull().primaryKey(),
	created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
	updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	title: varchar("title"),
	text: varchar("text").notNull(),
	no_ai: boolean("no_ai").default(false),
	ai_ran: boolean("ai_ran").default(false),
	title_summary: varchar("title_summary"),
	text_summary: varchar("text_summary"),
	sentiment: varchar("sentiment"),
	user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
},
(table) => {
	return {
		ix_entries_created_at: index("ix_entries_created_at").on(table.created_at),
		ix_entries_updated_at: index("ix_entries_updated_at").on(table.updated_at),
		ix_entries_user_id: index("ix_entries_user_id").on(table.user_id),
	}
});

export const jobs = pgTable("jobs", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull().primaryKey(),
	created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
	updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	method: varchar("method").notNull(),
	state: varchar("state").default('new'),
	run_on: machinetypes("run_on").default('gpu'),
	machine_id: varchar("machine_id"),
	data_in: jsonb("data_in"),
	data_out: jsonb("data_out"),
},
(table) => {
	return {
		ix_jobs_created_at: index("ix_jobs_created_at").on(table.created_at),
		ix_jobs_machine_id: index("ix_jobs_machine_id").on(table.machine_id),
		ix_jobs_method: index("ix_jobs_method").on(table.method),
		ix_jobs_run_on: index("ix_jobs_run_on").on(table.run_on),
		ix_jobs_state: index("ix_jobs_state").on(table.state),
		ix_jobs_updated_at: index("ix_jobs_updated_at").on(table.updated_at),
	}
});

export const shares = pgTable("shares", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull().primaryKey(),
	user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
	email: varchar("email", { length: 255 }),
	fields: boolean("fields"),
	books: boolean("books"),
	profile: boolean("profile"),
	last_seen: timestamp("last_seen", { withTimezone: true }).defaultNow(),
	new_entries: integer("new_entries").default(0),
},
(table) => {
	return {
		ix_shares_email: index("ix_shares_email").on(table.email),
		ix_shares_last_seen: index("ix_shares_last_seen").on(table.last_seen),
		ix_shares_user_id: index("ix_shares_user_id").on(table.user_id),
	}
});

export const notes = pgTable("notes", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull().primaryKey(),
	created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
	entry_id: uuid("entry_id").references(() => entries.id, { onDelete: "cascade" } ),
	user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
	type: notetypes("type").notNull(),
	text: varchar("text").notNull(),
	private: boolean("private").default(false),
},
(table) => {
	return {
		ix_notes_created_at: index("ix_notes_created_at").on(table.created_at),
		ix_notes_entry_id: index("ix_notes_entry_id").on(table.entry_id),
		ix_notes_user_id: index("ix_notes_user_id").on(table.user_id),
	}
});

export const modelHypers = pgTable("model_hypers", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull().primaryKey(),
	model: varchar("model").notNull(),
	model_version: integer("model_version").notNull(),
	user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
	created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
	score: doublePrecision("score").notNull(),
	hypers: jsonb("hypers").notNull(),
	meta: jsonb("meta"),
},
(table) => {
	return {
		ix_model_hypers_created_at: index("ix_model_hypers_created_at").on(table.created_at),
		ix_model_hypers_model: index("ix_model_hypers_model").on(table.model),
		ix_model_hypers_model_version: index("ix_model_hypers_model_version").on(table.model_version),
	}
});

export const entriesTags = pgTable("entries_tags", {
	entry_id: uuid("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" } ),
	tag_id: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" } ),
},
(table) => {
	return {
		entries_tags_pkey: primaryKey(table.entry_id, table.tag_id)
	}
});

export const users = pgTable("users", {
	id: uuid("id").notNull().primaryKey(),
	email: varchar("email").notNull(),
	hashed_password: varchar("hashed_password").notNull(),
	is_active: boolean("is_active").notNull(),
	is_superuser: boolean("is_superuser").notNull(),
	created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
	updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	first_name: varchar("first_name"),
	last_name: varchar("last_name"),
	gender: varchar("gender"),
	orientation: varchar("orientation"),
	birthday: date("birthday"),
	timezone: varchar("timezone"),
	bio: varchar("bio"),
	is_cool: boolean("is_cool").default(false),
	therapist: boolean("therapist").default(false),
	ai_ran: boolean("ai_ran").default(false),
	last_books: timestamp("last_books", { withTimezone: true }).defaultNow(),
	last_influencers: timestamp("last_influencers", { withTimezone: true }).defaultNow(),
	habitica_user_id: varchar("habitica_user_id"),
	habitica_api_token: varchar("habitica_api_token"),
	paid: boolean("paid"),
	is_verified: boolean("is_verified").default(true),
	cognito_id: varchar("cognito_id"),
},
(table) => {
	return {
		ix_users_cognito_id: index("ix_users_cognito_id").on(table.cognito_id),
		ix_users_created_at: index("ix_users_created_at").on(table.created_at),
		ix_users_email: uniqueIndex("ix_users_email").on(table.email),
		ix_users_last_books: index("ix_users_last_books").on(table.last_books),
		ix_users_last_influencers: index("ix_users_last_influencers").on(table.last_influencers),
		ix_users_updated_at: index("ix_users_updated_at").on(table.updated_at),
	}
});

export const profileMatches = pgTable("profile_matches", {
	user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	match_id: uuid("match_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	score: doublePrecision("score").notNull(),
},
(table) => {
	return {
		profile_matches_pkey: primaryKey(table.user_id, table.match_id)
	}
});

export const influencers = pgTable("influencers", {
	field_id: uuid("field_id").notNull().references(() => fields.id, { onDelete: "cascade" } ),
	influencer_id: uuid("influencer_id").notNull().references(() => fields.id, { onDelete: "cascade" } ),
	score: doublePrecision("score").notNull(),
},
(table) => {
	return {
		influencers_pkey: primaryKey(table.field_id, table.influencer_id)
	}
});

export const sharesTags = pgTable("shares_tags", {
	share_id: uuid("share_id").notNull().references(() => shares.id, { onDelete: "cascade" } ),
	tag_id: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" } ),
	selected: boolean("selected").default(true),
},
(table) => {
	return {
		shares_tags_pkey: primaryKey(table.share_id, table.tag_id)
	}
});

export const bookshelf = pgTable("bookshelf", {
	created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
	updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	book_id: integer("book_id").notNull(),
	user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	shelf: shelves("shelf").notNull(),
	score: doublePrecision("score"),
},
(table) => {
	return {
		ix_bookshelf_created_at: index("ix_bookshelf_created_at").on(table.created_at),
		ix_bookshelf_updated_at: index("ix_bookshelf_updated_at").on(table.updated_at),
		bookshelf_pkey: primaryKey(table.book_id, table.user_id)
	}
});

export const fieldEntries2 = pgTable("field_entries2", {
	field_id: uuid("field_id").notNull().references(() => fields.id, { onDelete: "cascade" } ),
	day: date("day").notNull(),
	created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
	value: doublePrecision("value"),
	user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
	dupes: jsonb("dupes"),
	dupe: integer("dupe"),
},
(table) => {
	return {
		ix_field_entries2_created_at: index("ix_field_entries2_created_at").on(table.created_at),
		ix_field_entries2_day: index("ix_field_entries2_day").on(table.day),
		ix_field_entries2_field_id: index("ix_field_entries2_field_id").on(table.field_id),
		ix_field_entries2_user_id: index("ix_field_entries2_user_id").on(table.user_id),
		field_entries2_pkey: primaryKey(table.field_id, table.day)
	}
});
