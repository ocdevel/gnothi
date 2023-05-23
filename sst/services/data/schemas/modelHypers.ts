import {
  integer,
  varchar,
  pgTable,
  index, doublePrecision, jsonb,
} from 'drizzle-orm/pg-core'
import {InferModel} from "drizzle-orm"
import {idCol, tsCol} from "./utils";
import {userId} from "./users";

export const modelHypers = pgTable('model_hypers', {
  id: idCol(),
  model: varchar("model").notNull(),
  model_version: integer("model_version").notNull(),
  user_id: userId(),
  created_at: tsCol('created_at'),
  score: doublePrecision('score').notNull(),
  hypers: jsonb('hypers'),
  meta: jsonb('meta'),
}, (table) => {
  return {
    ix_model_hypers_model_version: index("ix_model_hypers_model_version").on(table.model_version),
    ix_model_hypers_created_at: index("ix_model_hypers_created_at").on(table.created_at),
    ix_model_hypers_model: index("ix_model_hypers_model").on(table.model),
  }
})

export type ModelHyper = InferModel<typeof modelHypers>
