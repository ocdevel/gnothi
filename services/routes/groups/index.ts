import {Routes} from '@gnothi/schemas'
import {DB} from '../../data/db'
import {Route} from '../types'
import {db} from "../../data/dbSingleton.js";
import {groups, groupsUsers} from "../../data/schemas/groups.js";
import {eq, sql} from "drizzle-orm";
import {ulid} from "ulid";

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

export const groups_join_request = new Route(r.groups_join_request, async (req, context) => {
  const {uid, db: {drizzle}} = context
  // FIXME move to models file
  // FIXME reference old python code, ensure nothing missing
  // FIXME add petname
  const [updatedGroup, groupUsers] = await Promise.all([
    drizzle
      .update(groups)
      .set({n_members: sql`n_members + 1`})
      .where(eq(groups.id, req.id)),
    drizzle
      .insert(groupsUsers)
      .values({
        group_id: req.id,
        user_id: uid,
        username: ulid()
      })
  ])
  return groupUsers
})