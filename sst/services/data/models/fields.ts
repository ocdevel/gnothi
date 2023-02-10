import {Base} from './base'
import {db} from '../db'
import * as S from '@gnothi/schemas'

export class Fields extends Base {
  async list() {
    return db.query<S.Fields.fields_list_response>(
      "select * from fields where user_id=$1",
      [this.uid]
    )
  }

  async post(req: S.Fields.fields_post_request) {
    return db.query<S.Fields.fields_list_response>(
      `
        insert into fields (name, type, default_value, default_value_value, user_id)
        values (
          $1, 
          cast($2 as fieldtype), 
          cast($3 as defaultvaluetypes), 
          $4, 
          $5
        )
        returning *;`,
      [
        req.name,
        req.type,
        req.default_value,
        req.default_value_value,
        this.uid,
      ]
    )
  }

  async entries_list(req: S.Fields.fields_entries_list_request) {
    const sql = `
      ${this.with_tz}
      select fe.* from field_entries2 fe
      inner join with_tz on with_tz.id=fe.user_id 
      where fe.user_id=$1
      and date(${this.tz_read})=
          --use created_at rather than day in case they switch timezones
          date(fe.created_at ${this.at_tz})`
    return db.query<S.Fields.fields_list_response>(
      sql,
      [
        this.uid, // $1 is in with_tz. It's re-used in our own query above
        req.day, // $2 is in tz_read and tz_write
      ]
    )
  }

  async entries_post(req: S.Fields.fields_entries_post_request) {
    const sql = `
      ${this.with_tz}
      insert into field_entries2 (user_id, field_id, value, day, created_at)
      select $1, $3, $4, date(${this.tz_read}), ${this.tz_write}
      from with_tz
      on conflict (field_id, day) do update set value=$4, dupes=null, dupe=0
      returning *
    `
    return db.query(
      sql,
      [
        this.uid, // $1 in with_tz
        req.day, // $2 in tz_read and tz_write
        req.field_id,,
        req.value,
      ]
    )
  }
}
