import {Base} from './base'
import {db} from '../db'
import * as S from '@gnothi/schemas'

export class Fields extends Base {
  async list() {
    return db.executeStatement<S.Fields.fields_list_response>({
      sql: "select * from fields where user_id=:user_id",
      parameters: [
        {name: "user_id", value: {stringValue: this.uid}, typeHint: "UUID"}
      ]
    })
  }

  async post(req: S.Fields.fields_post_request) {
    return db.executeStatement<S.Fields.fields_list_response>({
      sql: `
        insert into fields (name, type, default_value, default_value_value, user_id)
        values (
          :name, 
          cast(:type as fieldtype), 
          cast(:default_value as defaultvaluetypes), 
          :default_value_value, 
          :user_id
        )
        returning *;`,
      parameters: [
        {name: "name", value: {stringValue: req.name}},
        {name: "type", value: {stringValue: req.type}},
        {name: "default_value", value: {stringValue: req.default_value}},
        {name: "default_value_value",
          value: (req.default_value_value === undefined
          ? {isNull: true}
          : {longValue: req.default_value_value}
        )},
        {name: "user_id", typeHint: "UUID", value: {stringValue: this.uid}},
      ]
    })
  }

  async entries_list(req: S.Fields.fields_entries_list_request) {
    const sql = `
      ${this.with_tz}
      select fe.* from field_entries2 fe
      inner join with_tz on with_tz.id=fe.user_id 
      where fe.user_id=:user_id
      and date(${this.tz_read})=
          --use created_at rather than day in case they switch timezones
          date(fe.created_at ${this.at_tz})`
    return db.executeStatement<S.Fields.fields_list_response>({
      sql,
      parameters: [
        {name: "day", value: req.day ? {stringValue: req.day} : {isNull: true}},
        {name: "user_id", value: {stringValue: this.uid}, typeHint: "UUID"}
      ]
    })
  }

  async entries_post(req: S.Fields.fields_entries_post_request) {
    const sql = `
      ${this.with_tz}
      insert into field_entries2 (user_id, field_id, value, day, created_at)
      select :user_id, :field_id, :value, date(${this.tz_read}), ${this.tz_write}
      from with_tz
      on conflict (field_id, day) do update set value=:value, dupes=null, dupe=0
      returning *
    `
    return db.executeStatement({
      sql,
      parameters: [
        {name: "user_id", typeHint: "UUID", value: {stringValue: this.uid}},
        {name: "field_id", typeHint: "UUID", value: {stringValue: req.field_id}},
        {name: "value", value: {longValue: req.value}},
        {name: "day", value: req.day ? {stringValue: req.day} : {isNull: true}}
      ]
    })
  }
}
