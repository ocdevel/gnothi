import * as S from '@gnothi/schemas'
import {db} from '../../data/db'
import {GnothiError} from "../errors";
import {z} from 'zod'
import {reduce as _reduce} from "lodash"
import {Function} from "@serverless-stack/node/function"

const r = S.Routes.routes

r.entries_list_request.fn = r.entries_list_request.fnDef.implement(async (req, context) => {

  const entries = await db.exec({
    sql: `
      select e.*,
             json_agg(et.*) as entries_tags
      from entries e
             inner join entries_tags et on e.id = et.entry_id
      where e.user_id = :user_id
      group by e.id
      order by e.created_at desc;
    `,
    values: {user_id: context.user.id},
    zIn: S.Tags.EntryTag.merge(S.Entries.Entry)
  })
  // TODO update SQL to do this conversion, we'll use it elsewhere
  const withBoolMap = entries.map(entry => ({
    entry,
    tags: _reduce(entry.tags, (m, v) => ({...m, [v.tag_id]: true}), {})
  }))
  return withBoolMap
})


r.entries_upsert_request.fn = r.entries_upsert_request.fnDef.implement(async (req, context) => {
  const user_id = context.user.id
  const {tags, entry} = req
  if (!Object.values(tags).some(v => v)) {
    throw new GnothiError({message: "Each entry must belong to at least one journal", key: "NO_TAGS"})
  }

  let entry_id: string = entry.id
  let dbEntry: S.Entries.Entry
  if (!entry_id) {
    dbEntry = (await db.insert("entries", {...entry, user_id}))[0]
    entry_id = dbEntry.id
  } else {
    dbEntry = (await db.exec({
      sql: `select * from entries where id=:entry_id`,
      values: {id: entry_id},
      zIn: S.Entries.Entry
    }))[0]
    await db.exec({
      sql: "delete from entry_tags where entry_id=:entry_id",
      values: {entry_id},
      zIn: S.Tags.EntryTag
    })
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
      await db.insert("entries_tags", {tag_id, entry_id})
  }

  // TODO undefineds
  dbEntry.title = "Title"
  dbEntry.text_summary = "Text Summary"
  dbEntry.title_summary = "Title Summary"
  dbEntry.sentiment = "Sentiment"

  // FIXME
  // entry.update_snoopers(d.db)
  //M.Entry.run_models(db, entry)

  return [{entry: dbEntry, tags}]
})


// r.entries_upsert_response.fn = r.entries_upsert_response.fnDef.implement(async (req, context) => {
