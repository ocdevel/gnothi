import {Base} from './base'
import {db} from '../dbSingleton'
import * as S from '@gnothi/schemas'
import {sql} from "drizzle-orm/sql"
import {users} from '../schemas/users'
import {fields} from '../schemas/fields'
import {fieldEntries} from '../schemas/fieldEntries'
import { and, asc, desc, eq, or } from 'drizzle-orm/expressions';

export class Fields extends Base {
  async list() {
    const {drizzle} = this.context.db
    const res = await drizzle.select().from(fields).where(eq(fields.user_id, this.uid))
    return res.map(db.removeNull)
  }

  async post(req: S.Fields.fields_post_request) {
    const {drizzle} = this.context.db
    const res = await drizzle.insert(fields).values({
      name: req.name,
      type: req.type,
      default_value: req.default_value,
      default_value_value: req.default_value_value,
      user_id: this.uid
    }).returning()
    return res.map(db.removeNull)
  }

  async entriesList(req: S.Fields.fields_entries_list_request) {
    const {uid} = this.context
    const day = req.day
    return db.query<S.Fields.fields_list_response>(sql`
      ${this.with_tz()}
      select fe.* from ${fieldEntries} fe
      inner join with_tz on with_tz.id=fe.user_id 
      where fe.user_id=${uid}
      and date(${this.tz_read(day)})=
          --use created_at rather than day in case they switch timezones
          date(fe.created_at at time zone with_tz.tz)`)
  }

  async entriesPost(req: S.Fields.fields_entries_post_request) {
    const {uid} = this.context
    const {day, field_id, value} = req
    return db.query(sql`
      ${this.with_tz()}
      insert into ${fieldEntries} (user_id, field_id, value, day, created_at)
      select ${uid}, ${field_id}, ${value}, date(${this.tz_read(day)}), ${this.tz_write(day)}
      from with_tz
      on conflict (field_id, day) do update set value=${value}, dupes=null, dupe=0
      returning *
    `)
  }
}
