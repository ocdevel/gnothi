import {Base} from './base'
import {db} from '../db'
import * as S from '@gnothi/schemas'
import {sql} from "drizzle-orm/sql"
import { and, asc, desc, eq, or } from 'drizzle-orm/expressions';
import { pgTable, index, text, varchar, uuid, pgEnum, doublePrecision, timestamp, json } from 'drizzle-orm/pg-core';

const fieldTypes = pgEnum('field_type', ["number", "fivestar", "check", "option"])
const defaultValTypes = pgEnum('default_value_type', ["value", "average", "ffill"])
const t = pgTable('fields', {
  id: uuid('id').defaultRandom().notNull().primaryKey(),
  type: fieldTypes("type").default("fivestar"),
  name: varchar('name').notNull(),
  created_at: timestamp('created_at', {withTimezone: true}).defaultNow(),
  excluded_at: timestamp('excluded_at', {withTimezone: true}),
  default_value: defaultValTypes("default_value").default("ffill"),
  default_value_value: doublePrecision('default_value_value'),
  attributes: json("attributes"),
  service: varchar('service'),
  service_id: varchar('service_id'),
  user_id: uuid('user_id').notNull(),//.references(() => users.id, {onDelete: 'cascade'})
  influencer_score: doublePrecision("influencer_score").default(0),
  next_pred: doublePrecision("next_pred").default(0),
  avg: doublePrecision("avg").default(0),
}, (table) => {
  return {
    ix_fields_excluded_at: index("ix_fields_excluded_at").on(table.excluded_at),
    ix_fields_user_id: index("ix_fields_user_id").on(table.user_id),
    ix_fields_created_at: index("ix_fields_created_at").on(table.created_at),
  }
})


export class Fields extends Base {
  table
  async list() {
    const client = await db.client()
    const res = await client.select().from(t).where(eq(t.user_id, this.uid))
    return res.map(db._removeNull)
  }

  async post(req: S.Fields.fields_post_request) {
    return db.query<S.Fields.fields_list_response>(
      sql`
        insert into fields (name, type, default_value, default_value_value, user_id)
        values (
          ${req.name}, 
          cast(${req.type} as fieldtype), 
          cast(${req.default_value} as defaultvaluetypes), 
          ${req.default_value_value}, 
          ${this.uid}
        )
        returning *;`
    )
  }

  async entries_list(req: S.Fields.fields_entries_list_request) {
    const uid = this.uid
    const day = req.day
    return db.query<S.Fields.fields_list_response>(sql`
      ${this.with_tz(uid)}
      select fe.* from field_entries2 fe
      inner join with_tz on with_tz.id=fe.user_id 
      where fe.user_id=${uid}
      and date(${this.tz_read(day)})=
          --use created_at rather than day in case they switch timezones
          date(fe.created_at at time zone with_tz.tz)`)
  }

  async entries_post(req: S.Fields.fields_entries_post_request) {
    const {uid} = this
    const {day, field_id, value} = req
    return db.query(sql`
      ${this.with_tz(uid)}
      insert into field_entries2 (user_id, field_id, value, day, created_at)
      select ${uid}, ${field_id}, ${value}, date(${this.tz_read(day)}), ${this.tz_write(day)}
      from with_tz
      on conflict (field_id, day) do update set value=${value}, dupes=null, dupe=0
      returning *
    `)
  }
}
