import { pgTable, pgEnum, pgSchema, AnyPgColumn, serial, varchar, integer, index, foreignKey, uuid, timestamp, boolean, doublePrecision, jsonb, json, uniqueIndex, date, primaryKey } from "drizzle-orm/pg-core"

export const defaultvaluetypes = pgEnum("defaultvaluetypes", ['value', 'average', 'ffill'])
export const fieldtype = pgEnum("fieldtype", ['number', 'fivestar', 'check', 'option'])
export const machinetypes = pgEnum("machinetypes", ['gpu', 'server'])
export const notetypes = pgEnum("notetypes", ['label', 'note', 'resource'])
export const shelves = pgEnum("shelves", ['ai', 'like', 'already_read', 'dislike', 'remove', 'recommend', 'cosine'])

import { sql } from "drizzle-orm"

export const books = pgTable("books", {
	id: serial("id").notNull(),
	title: varchar("title").notNull(),
	text: varchar("text").notNull(),
	author: varchar("author"),
	topic: varchar("topic"),
	thumbs: integer("thumbs"),
	amazon: varchar("amazon"),
});

export const entries = pgTable("entries", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	title: varchar("title"),
	text: varchar("text").notNull(),
	noAi: boolean("no_ai"),
	aiRan: boolean("ai_ran"),
	titleSummary: varchar("title_summary"),
	textSummary: varchar("text_summary"),
	sentiment: varchar("sentiment"),
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
},
(table) => {
	return {
		ixEntriesCreatedAt: index("ix_entries_created_at").on(table.createdAt),
		ixEntriesUpdatedAt: index("ix_entries_updated_at").on(table.updatedAt),
		ixEntriesUserId: index("ix_entries_user_id").on(table.userId),
	}
});

export const cacheEntries = pgTable("cache_entries", {
	entryId: uuid("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" } ),
	paras: varchar("paras", { length:  }).array(),
	clean: varchar("clean", { length:  }).array(),
	vectors: doublePrecision("vectors").array(),
});

export const fieldEntries = pgTable("field_entries", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull(),
	value: doublePrecision("value"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
	fieldId: uuid("field_id").references(() => fields.id, { onDelete: "cascade" } ),
},
(table) => {
	return {
		ixFieldEntriesCreatedAt: index("ix_field_entries_created_at").on(table.createdAt),
		ixFieldEntriesUserId: index("ix_field_entries_user_id").on(table.userId),
	}
});

export const tags = pgTable("tags", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
	name: varchar("name").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	selected: boolean("selected").default(true),
	main: boolean("main"),
},
(table) => {
	return {
		ixTagsCreatedAt: index("ix_tags_created_at").on(table.createdAt),
		ixTagsUserId: index("ix_tags_user_id").on(table.userId),
	}
});

export const machines = pgTable("machines", {
	id: varchar("id").notNull(),
	status: varchar("status"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		ixMachinesCreatedAt: index("ix_machines_created_at").on(table.createdAt),
		ixMachinesUpdatedAt: index("ix_machines_updated_at").on(table.updatedAt),
	}
});

export const cacheUsers = pgTable("cache_users", {
	userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	paras: varchar("paras", { length:  }).array(),
	clean: varchar("clean", { length:  }).array(),
	vectors: doublePrecision("vectors").array(),
});

export const people = pgTable("people", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull(),
	name: varchar("name"),
	relation: varchar("relation"),
	issues: varchar("issues"),
	bio: varchar("bio"),
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
},
(table) => {
	return {
		ixPeopleUserId: index("ix_people_user_id").on(table.userId),
	}
});

export const jobs = pgTable("jobs", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	method: varchar("method").notNull(),
	state: varchar("state").default('new'),
	runOn: machinetypes("run_on").default('gpu'),
	machineId: varchar("machine_id"),
	dataIn: jsonb("data_in"),
	dataOut: jsonb("data_out"),
},
(table) => {
	return {
		ixJobsCreatedAt: index("ix_jobs_created_at").on(table.createdAt),
		ixJobsMachineId: index("ix_jobs_machine_id").on(table.machineId),
		ixJobsMethod: index("ix_jobs_method").on(table.method),
		ixJobsRunOn: index("ix_jobs_run_on").on(table.runOn),
		ixJobsState: index("ix_jobs_state").on(table.state),
		ixJobsUpdatedAt: index("ix_jobs_updated_at").on(table.updatedAt),
	}
});

export const fields = pgTable("fields", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull(),
	type: fieldtype("type"),
	name: varchar("name"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	excludedAt: timestamp("excluded_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	defaultValue: defaultvaluetypes("default_value").default('value'),
	defaultValueValue: doublePrecision("default_value_value"),
	attributes: json("attributes"),
	service: varchar("service"),
	serviceId: varchar("service_id"),
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
	influencerScore: doublePrecision("influencer_score"),
	nextPred: doublePrecision("next_pred"),
	avg: doublePrecision("avg"),
},
(table) => {
	return {
		ixFieldsCreatedAt: index("ix_fields_created_at").on(table.createdAt),
		ixFieldsExcludedAt: index("ix_fields_excluded_at").on(table.excludedAt),
		ixFieldsUserId: index("ix_fields_user_id").on(table.userId),
	}
});

export const notes = pgTable("notes", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	entryId: uuid("entry_id").references(() => entries.id, { onDelete: "cascade" } ),
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
	type: notetypes("type").notNull(),
	text: varchar("text").notNull(),
	private: boolean("private"),
},
(table) => {
	return {
		ixNotesCreatedAt: index("ix_notes_created_at").on(table.createdAt),
		ixNotesEntryId: index("ix_notes_entry_id").on(table.entryId),
		ixNotesUserId: index("ix_notes_user_id").on(table.userId),
	}
});

export const shares = pgTable("shares", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
	email: varchar("email", { length: 255 }),
	fields: boolean("fields"),
	books: boolean("books"),
	profile: boolean("profile"),
	lastSeen: timestamp("last_seen", { withTimezone: true, mode: 'string' }).defaultNow(),
	newEntries: integer("new_entries"),
},
(table) => {
	return {
		ixSharesEmail: index("ix_shares_email").on(table.email),
		ixSharesLastSeen: index("ix_shares_last_seen").on(table.lastSeen),
		ixSharesUserId: index("ix_shares_user_id").on(table.userId),
	}
});

export const modelHypers = pgTable("model_hypers", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull(),
	model: varchar("model").notNull(),
	modelVersion: integer("model_version").notNull(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	score: doublePrecision("score").notNull(),
	hypers: jsonb("hypers").notNull(),
	meta: jsonb("meta"),
},
(table) => {
	return {
		ixModelHypersCreatedAt: index("ix_model_hypers_created_at").on(table.createdAt),
		ixModelHypersModel: index("ix_model_hypers_model").on(table.model),
		ixModelHypersModelVersion: index("ix_model_hypers_model_version").on(table.modelVersion),
	}
});

export const users = pgTable("users", {
	id: uuid("id").notNull(),
	email: varchar("email").notNull(),
	hashedPassword: varchar("hashed_password").notNull(),
	isActive: boolean("is_active").notNull(),
	isSuperuser: boolean("is_superuser").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	firstName: varchar("first_name"),
	lastName: varchar("last_name"),
	gender: varchar("gender"),
	orientation: varchar("orientation"),
	birthday: date("birthday"),
	timezone: varchar("timezone"),
	bio: varchar("bio"),
	isCool: boolean("is_cool"),
	therapist: boolean("therapist"),
	aiRan: boolean("ai_ran"),
	lastBooks: timestamp("last_books", { withTimezone: true, mode: 'string' }).defaultNow(),
	lastInfluencers: timestamp("last_influencers", { withTimezone: true, mode: 'string' }).defaultNow(),
	habiticaUserId: varchar("habitica_user_id"),
	habiticaApiToken: varchar("habitica_api_token"),
	paid: boolean("paid"),
	isVerified: boolean("is_verified").default(true),
},
(table) => {
	return {
		ixUsersCreatedAt: index("ix_users_created_at").on(table.createdAt),
		ixUsersEmail: uniqueIndex("ix_users_email").on(table.email),
		ixUsersLastBooks: index("ix_users_last_books").on(table.lastBooks),
		ixUsersLastInfluencers: index("ix_users_last_influencers").on(table.lastInfluencers),
		ixUsersUpdatedAt: index("ix_users_updated_at").on(table.updatedAt),
	}
});

export const entriesTags = pgTable("entries_tags", {
	entryId: uuid("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" } ),
	tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" } ),
},
(table) => {
	return {
		entriesTagsPkey: primaryKey(table.entryId, table.tagId)
	}
});

export const influencers = pgTable("influencers", {
	fieldId: uuid("field_id").notNull().references(() => fields.id, { onDelete: "cascade" } ),
	influencerId: uuid("influencer_id").notNull().references(() => fields.id, { onDelete: "cascade" } ),
	score: doublePrecision("score").notNull(),
},
(table) => {
	return {
		influencersPkey: primaryKey(table.fieldId, table.influencerId)
	}
});

export const profileMatches = pgTable("profile_matches", {
	userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	matchId: uuid("match_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	score: doublePrecision("score").notNull(),
},
(table) => {
	return {
		profileMatchesPkey: primaryKey(table.userId, table.matchId)
	}
});

export const sharesTags = pgTable("shares_tags", {
	shareId: uuid("share_id").notNull().references(() => shares.id, { onDelete: "cascade" } ),
	tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" } ),
	selected: boolean("selected").default(true),
},
(table) => {
	return {
		sharesTagsPkey: primaryKey(table.shareId, table.tagId)
	}
});

export const bookshelf = pgTable("bookshelf", {
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	bookId: integer("book_id").notNull(),
	userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	shelf: shelves("shelf").notNull(),
	score: doublePrecision("score"),
},
(table) => {
	return {
		ixBookshelfCreatedAt: index("ix_bookshelf_created_at").on(table.createdAt),
		ixBookshelfUpdatedAt: index("ix_bookshelf_updated_at").on(table.updatedAt),
		bookshelfPkey: primaryKey(table.bookId, table.userId)
	}
});

export const fieldEntries2 = pgTable("field_entries2", {
	fieldId: uuid("field_id").notNull().references(() => fields.id, { onDelete: "cascade" } ),
	day: date("day").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	value: doublePrecision("value"),
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
	dupes: jsonb("dupes"),
	dupe: integer("dupe"),
},
(table) => {
	return {
		ixFieldEntries2CreatedAt: index("ix_field_entries2_created_at").on(table.createdAt),
		ixFieldEntries2Day: index("ix_field_entries2_day").on(table.day),
		ixFieldEntries2FieldId: index("ix_field_entries2_field_id").on(table.fieldId),
		ixFieldEntries2UserId: index("ix_field_entries2_user_id").on(table.userId),
		fieldEntries2Pkey: primaryKey(table.fieldId, table.day)
	}
});