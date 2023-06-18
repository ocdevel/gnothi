import {
  pgTable,
  doublePrecision,
  primaryKey
} from 'drizzle-orm/pg-core';
import {InferModel} from 'drizzle-orm'

import {fields, fieldId} from "./fields"

// This table not being used currently, until I bring back the system for behaviors. Just carrying
// over the values from v0 in case.
export const influencers = pgTable('influencers', {
  field_id: fieldId(),
  influencer_id: fieldId("influencer_id"),
  score: doublePrecision('score').notNull()
}, (table) => {
  return {
    pk: primaryKey(table.field_id, table.influencer_id),
  }
})

export type Influencer = InferModel<typeof influencers>
