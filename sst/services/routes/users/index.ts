import {Routes} from '@gnothi/schemas'
import {Route} from '../types'
import {users} from '../../data/schemas/users'
import {and, eq} from 'drizzle-orm'

const r = Routes.routes

export const users_everything_request = new Route(r.users_everything_request, async (req, context) => {
  await Promise.all(([
    'users_list_request',
    'tags_list_request',
    // 'entries_list_request', // now this is kicked off client-side with filters
    'fields_list_request',
    'fields_entries_list_request',
    'groups_mine_list_request',
    'notifs_groups_list_request',
    'notifs_notes_list_request',
    'shares_ingress_list_request',
    'shares_egress_list_request',
  ] as const).map(async (event) => {
    await context.handleReq({event, data: {}}, context)
  }))
  // mark as logged in
  await context.db.drizzle.update(users).set({updated_at: new Date()}).where(eq(users.id, context.uid))
  return []
})

export const users_list_request = new Route(r.users_list_request,async function(req, context) {
  // main user always comes first
  const users =  [context.user]

  // TODO fetch shares
  // const users = await DB.selectFrom("users")
  //   .where("id", "=", context.user.id)
  //   .executeTakeFirst()
  return users
})

export const users_acknowledge_request = new Route(r.users_acknowledge_request, async function(req, context) {
  const {uid, db} = context
  await db.drizzle.update(users).set({
    accept_terms_conditions: new Date(),
    accept_privacy_policy: new Date(),
    accept_disclaimer: new Date(),
  }).where(eq(users.id, uid))
  return []
})
