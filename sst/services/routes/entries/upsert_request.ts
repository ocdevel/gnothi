import * as S from '@gnothi/schemas'
import {db} from '../../data/db'
import {GnothiError} from "../errors";
import {summarize} from '../../ml/node/summarize'
import {keywords} from '../../ml/node/keywords'
import {upsert} from '../../ml/node/upsert'

const r = S.Routes.routes

r.entries_upsert_request.fn = r.entries_upsert_request.fnDef.implement(async (req, context: S.Api.FnContext) => {
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
  dbEntry.text_summary = "Summary: AI is generating"
  dbEntry.title_summary = "Title: AI is generating"
  dbEntry.sentiment = "Sentiment: AI is generating"

  return [{entry: dbEntry, tags}]
})

r.entries_upsert_response.fn = r.entries_upsert_response.fnDef.implement(async (req, context) => {
  const {entry, tags} = req

  const pUpsert = upsert(entry)
  const pTitleAndSummary = summarize({
    texts: [entry.text, entry.text],
    params: [{min_length: 20, max_length: 80}, {min_length: 100, max_length: 300}]
  })
  const pKeywords = keywords({
    texts: [entry.text],
    params: [{top_n: 5}],
  })

  const final = await Promise.all([pUpsert, pTitleAndSummary, pKeywords])

  const updated = {
    ...entry,
    title_summary: final[1][0],
    text_summary: final[1][1]
  }

  await db.executeStatement({
    sql: `update entries set title_summary=:title_summary, text_summary=:text_summary
        where id=:id`,
    parameters: [
      {name: "title_summary", value: {stringValue: updated.title_summary}},
      {name: "text_summary", value: {stringValue: updated.text_summary}},
      {name: "id", value: {stringValue: entry.id}, typeHint: "UUID"}
    ]
  })

  // FIXME
  // entry.update_snoopers(d.db)
  //M.Entry.run_models(db, entry)

  return [{entry: updated, tags}]
})
