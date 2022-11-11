import {Routes} from '@gnothi/schemas'
import {DB, raw} from '../../data/db'

const r = Routes.routes

r.shares_ingress_list_request.fn = r.shares_ingress_list_request.fnDef.implement(async (req, context) => {
  return []
})

r.shares_egress_list_request.fn = r.shares_egress_list_request.fnDef.implement(async (req, context) => {
  return []
})
