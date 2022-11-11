import {Routes} from '@gnothi/schemas'
import {DB, raw} from '../../data/db'

const r = Routes.routes

r.tags_list_request.fn = r.tags_list_request.fnDef.implement(async (req, context) => {
  const tags = await DB.selectFrom('tags')
    .where("user_id", "=", context.user.id)
    .selectAll()
    .execute()
  return tags
})

