import {Routes} from '@gnothi/schemas'
import {FnContext, Route} from '../types'
import {users, User} from '../../data/schemas/users'
import {and, eq, sql} from 'drizzle-orm'
import {DB} from '../../data/db'
import {entriesUpsertResponse} from '../entries'

const r = Routes.routes

export const users_everything_request = new Route(r.users_everything_request, async (req, context) => {
  const promises: Promise<any>[] = [
    'users_whoami_request',
    'users_list_request',

    'tags_list_request',
    // 'entries_list_request', // now this is kicked off client-side with filters
    'fields_list_request',
    'fields_entries_list_request',
    'fields_influencers_list_request',

    // Not yet implemented, ease up on the networking until they're back
    // 'groups_mine_list_request',
    // 'notifs_groups_list_request',
    // 'notifs_notes_list_request',
    // 'shares_ingress_list_request',
    // 'shares_egress_list_request',

    'admin_analytics_list_request'
  ].map(async (event) => {
    await context.handleReq({event, data: {}}, context)
  })
  // mark as logged in
  promises.push(context.db.drizzle.update(users)
    .set({updated_at: new Date()})
    .where(eq(users.id, context.uid)))
  await Promise.all(promises)

  return [context.user] // required to pass on to background (next step)
})

// After the user is returned to the client, we see if their entries are in need of an AI migration. Eg, any entries
// which got stuck in processing; or deliberately when I change the models and invalidate all entries in the DB. Doing
// it per user on load saves me from running over the full database, for users who may not be returning (AI is expensive)
export const users_everything_response = new Route(r.users_everything_response, async (req, context) => {
  const uid = req.id
  for (let i = 0; i < 300; i++) {
    const stuckEntry = await context.m.entries.getStuckEntry(uid)
    if (!stuckEntry) {break}
    console.log(`Fixing: stuck ${i}`)
    // sending context for this user, see git-blame for detachedContext if we ever go outside this user
    await entriesUpsertResponse(stuckEntry, context)
    // Give openai some breathing room. Wait 1 second
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  return []
})

export const users_whoami_request = new Route(r.users_whoami_request, async (req, context) => {
  return [{
    uid: context.uid,
    vid: context.vid,
  }]
})

// list_response will be sent manually for all users we care about, when we care about them. Group members when
// entering a group, etc. When called directly via list_request, just returning [user, viewer].
// NOTE: whever list_response manually sent, be sure to run through S.Users.SantizeUser() to scrub
export const users_list_request = new Route(r.users_list_request,async function(req, context) {
  const users =  [context.user]

  // TODO fetch shares
  return users
})

export const users_put_request = new Route(r.users_put_request, async (req, context) => {
  // they'll be setting individual attributes, eg timezone. So remove anything zod optionally parses
  // in, unless it's explicitly null
  req = DB.removeUndefined(req)
  const res = await context.db.drizzle.update(users)
    .set(req) // validated / limited via zod
    .where(eq(users.id, context.uid))
    .returning()
  return res.map(DB.removeNull)
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
