import {Routes} from '@gnothi/schemas'
import {Tag} from '@gnothi/schemas/tags'
import {db} from '../../data/db'

const r = Routes.routes

r.tags_list_request.fn = r.tags_list_request.fnDef.implement(async (req, context) => {
  const tags = await db.exec({
    sql: 'select * from tags where user_id=:user_id',
    values: {user_id: context.user.id},
    zIn: Tag,
    zOut: Tag
  })
  return tags
})

