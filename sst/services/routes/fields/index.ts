import {Routes, Fields} from '@gnothi/schemas'
import type {fields_list_response} from '@gnothi/schemas/fields'
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
  return db.executeStatement<fields_list_response>({
    sql: `insert into fields (name, type, default_value, default_value_value, user_id)
        values (:name, :type, :default_value, :default_value_value, :user_id)
        returning *;`,
    parameters: [
      {name: "name", value: {stringValue: req.name}},
      {name: "type", value: {stringValue: req.type}},
      {name: "default_value", value: {stringValue: req.default_value}},
      {name: "default_value_value", value: {longValue: req.default_value_value}},
      {name: "user_id", typeHint: "UUID", value: {stringValue: context.user.id}},
    ]
  })
})

r.fields_entries_list_request.fn = r.fields_entries_list_request.fnDef.implement(async (req, context) => {
  return []
})

