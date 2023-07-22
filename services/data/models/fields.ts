import {Base} from './base'
import {DB} from '../db'
import {db} from '../dbSingleton'
import * as S from '@gnothi/schemas'
import {users} from '../schemas/users'
import {fields} from '../schemas/fields'
import {fieldEntries} from '../schemas/fieldEntries'
import {influencers, Influencer} from '../schemas/influencers'
import { and, asc, desc, eq, or, sql } from 'drizzle-orm';

export class Fields extends Base {
  async list() {
    const {uid, db} = this.context
    const {drizzle} = db
    const res = await drizzle.select().from(fields).where(eq(fields.user_id, uid)).orderBy(desc(fields.created_at))
    return res.map(DB.removeNull)
  }


  async post(req: S.Fields.fields_post_request) {
    const {uid, db} = this.context
    const {drizzle} = db
    const res = await drizzle.insert(fields).values({
      name: req.name,
      type: req.type,
      default_value: req.default_value,
      default_value_value: req.default_value_value,
      user_id: uid
    }).returning()
    return res.map(DB.removeNull)
  }

  async put(req: S.Fields.fields_put_request) {
    const {uid, db} = this.context
    const {drizzle} = db
    const {id, ...field} = req
    const res = await drizzle.update(fields)
      .set(field)
      .where(and(
        eq(fields.id, id),
        eq(fields.user_id, uid)
      ))
      .returning()
    return res.map(DB.removeNull)
  }

  async delete(req: S.Fields.fields_delete_request) {
    const {uid, db} = this.context
    const {drizzle} = db
    const res = await drizzle.delete(fields)
      .where(and(
        eq(fields.id, req.id),
        eq(fields.user_id, uid)
      ))
      .returning()
    return res.map(DB.removeNull)
  }


  async entriesList(req: S.Fields.fields_entries_list_request) {
    const {uid, db} = this.context
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
    const {uid, db} = this.context
    const {day, field_id, value} = req
    const res = db.query(sql`
      ${this.with_tz()}
      insert into ${fieldEntries} (user_id, field_id, value, day, created_at)
      select ${uid}, ${field_id}, ${value}, date(${this.tz_read(day)}), ${this.tz_write(day)}
      from with_tz
      on conflict (field_id, day) do update set value=${value}
      returning *
    `)
    await this.context.m.fields.updateAvg(field_id)
    return res
  }

  async historyList(req: S.Fields.fields_history_list_request) {
    const {uid, db} = this.context
    const {id} = req
    const res = await db.drizzle.execute(sql`
      select fe.value, fe.created_at from ${fieldEntries} fe
      where fe.field_id=${id} and fe.value is not null and fe.created_at is not null
      order by fe.created_at asc
    `)
    return res
  }

  async influencersList() {
    const {uid, db} = this.context
    const res = await db.drizzle.execute(sql`
      select i.* from ${influencers} i
      inner join ${fields} f on f.id=i.field_id
        and f.user_id=${uid}
    `)
    return res
  }

  async updateAvg(fid: string) {
    return this.context.db.drizzle.execute(sql`
      update fields set avg=(
          select avg(value) from field_entries2 fe
          where fe.field_id=${fid} and fe.value is not null
      ) where id=${fid}
    `)
  }
}
