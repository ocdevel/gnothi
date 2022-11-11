import {Routes} from '@gnothi/schemas'
import {DB, raw} from '../../data/db'

const r = Routes.routes

r.notifs_groups_list_request.fn = r.notifs_groups_list_request.fnDef.implement(async (req, context) => {
  return []
})

r.notifs_notes_list_request.fn = r.notifs_notes_list_request.fnDef.implement(async (req, context) => {
  return []
})
