import {Routes, Fields} from '@gnothi/schemas'
import type {fields_list_response} from '@gnothi/schemas/fields'
import dayjs from 'dayjs'
import {db} from '../../data/db'

const r = Routes.routes

r.fields_list_request.fn = r.fields_list_request.fnDef.implement(async (req, context) => {
  return db.executeStatement<fields_list_response>({
    sql: "select * from fields where user_id=:user_id",
    parameters: [
      {name: "user_id", value: {stringValue: context.user.id}, typeHint: "UUID"}
    ]
  })
})

r.fields_post_request.fn = r.fields_post_request.fnDef.implement(async (req, context) => {
  // TODO add snooping
  const dvv = (req.default_value_value === undefined)
    ? {isNull: true} as const
    : {longValue: req.default_value_value} as const
  return db.executeStatement<fields_list_response>({
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
      {name: "default_value_value", value: dvv},
      {name: "user_id", typeHint: "UUID", value: {stringValue: context.user.id}},
    ]
  })
})


const with_tz = `with with_tz as (
  select id, coalesce(timezone, 'America/Los_Angeles') as tz
  from users where id=:user_id
)`.replace('\n', ' ')
const at_tz = "at time zone with_tz.tz"
const tz_read = `coalesce(:day ::timestamp ${at_tz}, now() ${at_tz})`
const tz_write = `coalesce(:day ::timestamp ${at_tz}, now())`

r.fields_entries_list_request.fn = r.fields_entries_list_request.fnDef.implement(async (req, context) => {
  const sql = `
    ${with_tz}
    select fe.* from field_entries2 fe
    inner join with_tz on with_tz.id=fe.user_id 
    where fe.user_id=:user_id
    and date(${tz_read})=
        --use created_at rather than day in case they switch timezones
        date(fe.created_at ${at_tz})`
  return db.executeStatement<fields_list_response>({
    sql,
    parameters: [
      {name: "day", value: req.day ? {stringValue: req.day} : {isNull: true}},
      {name: "user_id", value: {stringValue: context.user.id}, typeHint: "UUID"}
    ]
  })
})

r.fields_entries_post_request.fn = r.fields_entries_post_request.fnDef.implement(async (req, context) => {
  const sql = `
    ${with_tz}
    insert into field_entries2 (user_id, field_id, value, day, created_at)
    select :user_id, :field_id, :value, date(${tz_read}), ${tz_write}
    from with_tz
    on conflict (field_id, day) do update set value=:value, dupes=null, dupe=0
    returning *
  `
  return db.executeStatement({
    sql,
    parameters: [
      {name: "user_id", typeHint: "UUID", value: {stringValue: context.user.id}},
      {name: "field_id", typeHint: "UUID", value: {stringValue: req.field_id}},
      {name: "value", value: {longValue: req.value}},
      {name: "day", value: req.day ? {stringValue: req.day} : {isNull: true}}
    ]
  })
})
