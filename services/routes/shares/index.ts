import {Routes} from '@gnothi/schemas'
import {DB} from '../../data/db'
import {Route} from '../types'
import * as S from '@gnothi/schemas'
import {z} from "zod";
import {v4 as uuid} from "uuid";
import {GnothiError} from "../errors.js";

const r = Routes.routes

// NOTE this file is all return [], shares system is disabled for now

export const shares_ingress_list_request = new Route(r.shares_ingress_list_request, async (req, context) => {
  return context.m.shares.ingress()
})

export const shares_egress_list_request = new Route(r.shares_egress_list_request, async (req, context) => {
  return context.m.shares.egress()
})

export const shares_post_request = new Route(r.shares_post_request, async (req, context) => {
  const {user, db: {drizzle}} = context
  // don't allow sharing with self
  if (req.users[user.email]) {
    delete req.users[user.email]
  }
  // FIXME doesn't return correct data, use handleReq or add extra in model
  return context.m.shares.post(req)
})

export const shares_put_request = new Route(r.shares_put_request, async (req, context) => {
  // FIXME doesn't return correct data, use handleReq or add extra in model
  return context.m.shares.put(req)
})

export const shares_delete_request = new Route(r.shares_delete_request, async (req, context) => {
  return context.m.shares.deleteShare(req.id)
})

export const shares_accept_request = new Route(r.shares_accept_request, async (req, context) => {
  return context.m.shares.acceptShare(req.id)
})

export const shares_reject_request = new Route(r.shares_reject_request, async (req, context) => {
  return context.m.shares.rejectShare(req.id)
})

export const shares_emailcheck_request = new Route(r.shares_emailcheck_request, async (req, context) => {
  if (context.viewer.email === req.email) {
    throw new GnothiError({message: "That's you, silly!", code: 400})
  }
  return context.m.shares.emailCheck(req.email)
})
