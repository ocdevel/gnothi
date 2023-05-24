import {Routes, Fields} from '@gnothi/schemas'
import {FnContext, Route} from '../types'
import {users} from '../../data/schemas/users'
import {eq, and} from 'drizzle-orm'
import {fields} from '../../data/schemas/fields'
import {Fields as FieldsModel} from '../../data/models/fields'

const r = Routes.routes

async function afterHabitica(context: FnContext) {
  await Promise.all([
    context.handleReq({event: 'users_list_request', data: {}}, context), // just for the habitica info
    context.handleReq({event: 'fields_list_request', data: {}}, context), // fetch newly-added habitica fields
  ])
}

export const habitica_post_request = new Route(r.habitica_post_request, async (req, context) => {
  context.user = (await context.db.drizzle.update(users)
    .set(req) // req safe-guarded by zod schema.
    .where(eq(users.id, context.uid))
    .returning())[0]
  await context.m.habitica.syncFor(context.user)
  await afterHabitica(context)
  return []
})

export const habitica_delete_request = new Route(r.habitica_delete_request, async (req, context) => {
  const {uid, db} = context
  // update user to remove habitica info
  context.user = (await db.drizzle.update(users)
    .set({habitica_user_id: null, habitica_api_token: null})
    .where(eq(users.id, uid))
    .returning())[0]
  await db.drizzle.delete(fields).where(and(
    eq(fields.user_id, uid),
    eq(fields.service, 'habitica')
  ))
  await afterHabitica(context)
  return []
})

export const habitica_sync_request = new Route(r.habitica_sync_request, async (req, context) => {
  await context.m.habitica.syncFor(context.user)
  await afterHabitica(context)
  return []
})

export const habitica_sync_cron = new Route(r.habitica_sync_cron, async (req, context) => {
  await context.m.habitica.cron()
  return []
})
