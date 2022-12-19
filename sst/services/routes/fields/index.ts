import {Routes, Fields} from '@gnothi/schemas'
import {Fields as FieldsModel} from '../../data/models/fields'

const r = Routes.routes

r.fields_list_request.fn = r.fields_list_request.fnDef.implement(async (req, context) => {
  return new FieldsModel(context.user.id).list()
})

r.fields_post_request.fn = r.fields_post_request.fnDef.implement(async (req, context) => {
  // TODO add snooping
  return new FieldsModel(context.user.id).post(req)
})


r.fields_entries_list_request.fn = r.fields_entries_list_request.fnDef.implement(async (req, context) => {
  return new FieldsModel(context.user.id).entries_list(req)
})

r.fields_entries_post_request.fn = r.fields_entries_post_request.fnDef.implement(async (req, context) => {
  return new FieldsModel(context.user.id).entries_post(req)
})
