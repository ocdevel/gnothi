import * as S from '@gnothi/schemas'
import {db} from '../../data/db'
import {GnothiError} from "../errors";
import {boolMapToKeys} from '@gnothi/schemas/utils'

const r = S.Routes.routes

type UpsertInner = (entry: S.Entries.Entry & {user_id: string}) => Promise<S.Entries.Entry>
async function upsertOuter(
  req: S.Entries.entries_post_request,
  context: S.Api.FnContext,
  upsertInner: UpsertInner
): Promise<S.Entries.entries_upsert_response[]> {
  const user_id = context.user.id
  const {tags, ...entry} = req
  const tids = boolMapToKeys(tags)
  if (!tids.length) {
    throw new GnothiError({message: "Each entry must belong to at least one journal", key: "NO_TAGS"})
  }
  const dbEntry = await upsertInner({...entry, user_id})
  const entry_id = dbEntry.id

  // FIXME
  // manual created-at override
  // iso_fmt = r"^\d{4}-([0]\d|1[0-2])-([0-2]\d|3[01])$"
  // created_at = data.get('created_at', None)
  // if created_at and re.match(iso_fmt, created_at):
  //     tz = M.User.tz(db, vid)
  //     db.execute(text("""
  //     update entries set created_at=(:day ::timestamp at time zone :tz)
  //     where id=:id
  //     """), dict(day=created_at, tz=tz, id=entry.id))
  //     db.commit()

  // TODO use batchExecuteStatement
  for (const tag_id of tids) {
    // FIXME
    await db.insert("entries_tags", {tag_id, entry_id})
  }

  return [{...dbEntry, tags}]
}

r.entries_post_request.fn = r.entries_post_request.fnDef.implement(async (req, context: S.Api.FnContext) => {
  return upsertOuter(req, context, async (entry) => {
    return db.insert("entries", entry)
  })
})


r.entries_put_request.fn = r.entries_put_request.fnDef.implement(async (req, context: S.Api.FnContext) => {
  const {id} = req
  return upsertOuter(req, context, async ({title, text, user_id}) => {
    // FIXME insecure. x-ref user-id with inner join
    await db.query(
      "delete from entries_tags where entry_id=$1",
      [id]
    )
    return db.queryFirst<S.Entries.Entry>(`
      update entries set title=$1, text=$2 
      where id=$3 and user_id=$4 
      returning *
    `, [title, text, id, user_id])
  })
})
