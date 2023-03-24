import * as S from '@gnothi/schemas'
import * as M from '../../data/models'
const r = S.Routes.routes

r.entries_delete_request.fn = r.entries_delete_request.fnDef.implement(async (req, context) => {
  const mEntries = new M.Entries(context.user.id)
  return mEntries.destroy(req.id)
})
