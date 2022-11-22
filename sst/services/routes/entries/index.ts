import * as S from '@gnothi/schemas'
import {DB, raw} from '../../data/db'
import {GnothiError} from "../errors";

const r = S.Routes.routes

r.entries_list_request.fn = r.entries_list_request.fnDef.implement(async (req, context) => {
  const entries = await DB.selectFrom("entries")
    .where("user_id", "=", context.user.id)
    .selectAll()
    .execute()
  return entries
})


async function entryUpsert(
  req: S.Entries.entries_post_request | S.Entries.entries_put_request,
  context: S.Api.FnContext,
) {
  const user_id = context.user.id
  const {tags, entry} = req
  if (!Object.values(tags).some(v => v)) {
    throw new GnothiError("Each entry must belong to at least one journal", "MISSING_TAG")
  }
  
  let entry_id: string = entry.id
  if (!entry_id) {
    const dbEntry = await DB.insertInto("entries")
      .values({...entry, user_id})
      .returning("id")
      .executeTakeFirst()
    entry_id = dbEntry!.id
  } else {
    await raw("delete from entry_tags where entry_id=:0",
      [{name: "0", value: {stringValue: entry_id}}]
    )
  }
  
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
  for (const [tag_id, v] of Object.entries(tags)) {
      if (!v) {continue}
      await DB.insertInto("entries_tags")
        .values({tag_id, entry_id})
        .execute()
  }
      
  // FIXME
  // entry.update_snoopers(d.db)
  //M.Entry.run_models(db, entry)
  
  return entry
}

r.entries_post_request.fn = r.entries_post_request.fnDef.implement(async (req, context) => {
  const entry = await entryUpsert(req, context)
  await context.handleRes({ws: true}, {
    event: "entries_list_response",
    error: false,
    code: 200,
    op: "prepend",
    data: [entry],
    keyby: "id"
  }, context)
  return []
})
