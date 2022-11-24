import {db} from '../../data/db'
import {Routes} from '@gnothi/schemas'

const r = Routes.routes

r.users_everything_request.fn = r.users_everything_request.fnDef.implement(async (req, context) => {
  for (const event of [
    'users_list_request',
    'tags_list_request',
    'entries_list_request',
    'fields_list_request',
    'fields_entries_list_request',
    'groups_mine_list_request',
    'notifs_groups_list_request',
    'notifs_notes_list_request',
    'shares_ingress_list_request',
    'shares_egress_list_request',
  ]) {
    await context.handleReq({event, data: {}}, context)
  }
  return []
})

r.users_list_request.fn = r.users_list_request.fnDef.implement(async function(req, context) {
  // main user always comes first
  const users =  [context.user]

  // TODO fetch shares
  // const users = await DB.selectFrom("users")
  //   .where("id", "=", context.user.id)
  //   .executeTakeFirst()
  return users
})
