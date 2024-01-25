import {Routes} from '@gnothi/schemas'
import {DB} from '../../data/db'
import {Route} from '../types'
import * as S from '@gnothi/schemas'
import {z} from "zod";
import {v4 as uuid} from "uuid";

const r = Routes.routes

// NOTE this file is all return [], shares system is disabled for now

export const shares_ingress_list_request = new Route(r.shares_ingress_list_request, async (req, context) => {
  return context.m.shares.ingress()
})

export const shares_egress_list_request = new Route(r.shares_egress_list_request, async (req, context) => {
  return []
  // return context.m.shares.egress()
})

export const shares_post_request = new Route(r.shares_post_request, async (req, context) => {
  return []
  // FIXME doesn't return correct data, use handleReq or add extra in model
  return context.m.shares.post(req)
})

export const shares_put_request = new Route(r.shares_put_request, async (req, context) => {
  return []
  // FIXME doesn't return correct data, use handleReq or add extra in model
  return context.m.shares.put(req)
})

export const shares_delete_request = new Route(r.shares_delete_request, async (req, context) => {
  return []
});

export const shares_emailcheck_request = new Route(r.shares_emailcheck_request, async (req, context) => {
  return context.m.shares.emailCheck(req.email)
})
