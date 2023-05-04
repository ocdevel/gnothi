import {db} from '../../data/dbSingleton'
import {Routes} from '@gnothi/schemas'
import {Route} from '../types'

const r = Routes.routes

export const users_everything_request = new Route(r.users_everything_request, async (req, context) => {
  await Promise.all(([
    'users_list_request',
    'tags_list_request',
    // 'entries_list_request', // now this is kicked off client-side with filters
    'fields_list_request',
    'fields_entries_list_request',
    'entries_notes_list_request',
    'groups_mine_list_request',
    'notifs_groups_list_request',
    'notifs_notes_list_request',
    'shares_ingress_list_request',
    'shares_egress_list_request',
  ] as const).map(async (event) => {
    await context.handleReq({event, data: {}}, context)
  }))
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
