import {Routes} from '@gnothi/schemas'
import {DB} from '../../data/db'
import {Route} from '../types'

const r = Routes.routes

export const shares_ingress_list_request = new Route(r.shares_ingress_list_request, async (req, context) => {
  return []
})

export const shares_egress_list_request = new Route(r.shares_egress_list_request, async (req, context) => {
  return []
})
