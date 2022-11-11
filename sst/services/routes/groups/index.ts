import {Routes} from '@gnothi/schemas'
import {DB, raw} from '../../data/db'

const r = Routes.routes

r.groups_enter_request.fn = r.groups_enter_request.fnDef.implement(async (req, context) => {
  context.handleReq({event: "groups_get_request", data: {}}, context)
  context.handleReq({event: "groups_members_list_request", data: {}}, context)
})

r.groups_list_request.fn = r.groups_list_request.fnDef.implement(async (req, context) => {
  return []
})

r.groups_mine_list_request.fn = r.groups_mine_list_request.fnDef.implement(async (req, context) => {
  return []
})
