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
  req: S.Entries.entries_post_request,
  context: S.Api.FnContext,
) {
  const {uid} = context.user
  if (!Object.values(tags).some()) {
    throw GnothiError("Each entry must belong to at least one journal")
  }
  if not any(v for k, v in data['tags'].items()):
      raise GnothiException(
          code=400,
          error="MISSING_TAG",
          detail="Each entry must belong to at least one journal"
      )

  new_entry = entry is None
  if new_entry:
      entry = M.Entry(user_id=vid)
      db.add(entry)
  else:
      db.query(M.EntryTag).filter_by(entry_id=entry.id).delete()
  entry.title = data['title']
  entry.text = data['text']
  entry.no_ai = data['no_ai'] or False
  db.commit()
  db.refresh(entry)

  # manual created-at override
  iso_fmt = r"^\d{4}-([0]\d|1[0-2])-([0-2]\d|3[01])$"
  created_at = data.get('created_at', None)
  if created_at and re.match(iso_fmt, created_at):
      tz = M.User.tz(db, vid)
      db.execute(text("""
      update entries set created_at=(:day ::timestamp at time zone :tz)
      where id=:id
      """), dict(day=created_at, tz=tz, id=entry.id))
      db.commit()

  for tag, v in data['tags'].items():
      if not v: continue
      db.add(M.EntryTag(entry_id=entry.id, tag_id=tag))
  db.commit()
  db.refresh(entry)

  # FIXME
  # entry.update_snoopers(d.db)
  M.Entry.run_models(db, entry)
  db.commit()

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
