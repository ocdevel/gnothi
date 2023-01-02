import * as S from '@gnothi/schemas'
import {db} from '../../data/db'
import * as M from '../../data/models'
const r = S.Routes.routes

r.entries_list_request.fn = r.entries_list_request.fnDef.implement(async (req, context) => {
  const mEntries = new M.Entries(context.user.id)
  return mEntries.filter(req)
})
