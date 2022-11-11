import {Routes} from '@gnothi/schemas'
import {DB, raw} from '../../data/db'

const r = Routes.routes

r.fields_list_request.fn = r.fields_list_request.fnDef.implement(async (req, context) => {
  return []
})

r.fields_entries_list_request.fn = r.fields_entries_list_request.fnDef.implement(async (req, context) => {
  return []
})
