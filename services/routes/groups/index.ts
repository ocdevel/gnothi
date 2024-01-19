import {Routes} from '@gnothi/schemas'
import {DB} from '../../data/db'
import {Route} from '../types'
import {db} from "../../data/dbSingleton.js";
import {groups} from "../../data/schemas/groups.js";

const r = Routes.routes

export const groups_enter_request = new Route(r.groups_enter_request, async (req, context) => {
  await Promise.all([
    context.handleReq({event: "groups_get_request", data: {}}, context),
    context.handleReq({event: "groups_members_list_request", data: {}}, context)
  ])
})

export const groups_list_request = new Route(r.groups_list_request, async (req, context) => {
  return context.db.drizzle.select().from(groups)
})

export const groups_mine_list_request = new Route(r.groups_mine_list_request, async (req, context) => {
  return []
})
