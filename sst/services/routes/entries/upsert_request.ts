import * as S from '@gnothi/schemas'
import {db} from '../../data/db'
import {GnothiError} from "../errors";
import {boolMapToKeys} from '@gnothi/schemas/utils'

const r = S.Routes.routes

r.entries_upsert_request.fn = r.entries_upsert_request.fnDef.implement(async (req, context: S.Api.FnContext) => {
  const user_id = context.user.id
  const {tags, ...entry} = req
  const tids = boolMapToKeys(tags)
  if (!tids.length) {
    throw new GnothiError({message: "Each entry must belong to at least one journal", key: "NO_TAGS"})
  }

  let entry_id: string = entry.id
  let dbEntry: S.Entries.Entry
  if (!entry_id) {
    // FIXME
    dbEntry = await db.insert("entries", {...entry, user_id})
    entry_id = dbEntry.id
  } else {
    const {text, title} = req
    dbEntry = await db.queryFirst<S.Entries.Entry>(
      `update entries set title=$1, text=$2 where id=$3 returning *`,
      [
        title,
        text,
        entry_id
      ]
    )
    await db.query(
      "delete from entries_tags where entry_id=:$1",
      [entry_id]
    )
  }

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
})
