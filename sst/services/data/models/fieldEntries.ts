import {Base} from './base'
import {db} from '../db'
import * as S from '@gnothi/schemas'
import {sql} from "drizzle-orm/sql"
import {users} from './users'

import { and, asc, desc, eq, or } from 'drizzle-orm/expressions';
import { pgTable, index, text, date, varchar, uuid, pgEnum, doublePrecision, timestamp, json, primaryKey } from 'drizzle-orm/pg-core';

import {fields} from "./fields"

export const fieldEntries = pgTable('field_entries2', {
  field_id: uuid('id').notNull().references(() => fields.id, {onDelete: 'cascade'}),
  day: date('day').notNull(),
  created_at: timestamp('created_at', {withTimezone: true}).defaultNow(),
  value: doublePrecision('value'),
  user_id: uuid('user_id').notNull().references(() => users.id, {onDelete: 'cascade'}),
}, (table) => {
  return {
    pk: primaryKey(table.field_id, table.day),
    ix_field_entries2_user_id: index("ix_field_entries2_user_id").on(table.user_id),
    ix_field_entries2_created_at: index("ix_field_entries2_created_at").on(table.created_at),
    ix_field_entries2_day: index("ix_field_entries2_day").on(table.day),
    ix_field_entries2_field_id: index("ix_field_entries2_field_id").on(table.field_id),
  }
})

export class FieldEntries extends Base {
  table

  async list(req: S.Fields.fields_entries_list_request) {
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

  async post(req: S.Fields.fields_entries_post_request) {
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
