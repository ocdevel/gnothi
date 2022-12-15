import * as S from '@gnothi/schemas'
import {db} from '../../data/db'
import {GnothiError} from "../errors";
import {upsert} from '../../ml/node/upsert'
import {boolMapToKeys} from '@gnothi/schemas/utils'

const r = S.Routes.routes

r.entries_upsert_request.fn = r.entries_upsert_request.fnDef.implement(async (req, context: S.Api.FnContext) => {
  const user_id = context.user.id
  const {entry, tags} = req
  const tids = boolMapToKeys(tags)
  if (!tids.length) {
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
      await db.insert("entries_tags", {tag_id, entry_id})
  }

  return [{entry: dbEntry, tags}]
})

r.entries_upsert_response.fn = r.entries_upsert_response.fnDef.implement(async (req, context) => {
  const {entry} = req
  const tids = boolMapToKeys(req.tags)

  const tags = await db.executeStatement<S.Tags.Tag>({
    sql: `select * from tags where id in :tids and user_id=:user_id`,
    parameters: [
      {name: "tids", typeHint: "UUID", value: {arrayValue: {stringValues: tids}}},
      {name: "user_id", typeHint: "UUID", value: {stringValue: context.user.id}}
    ]
  })

  // TODO how to handle multiple tags, where some are yes-ai and some are no-ai?
  // For now I'm assuming no.
  const excludeSummarize = tags.some(t => t.ai_summarize === false)
  const excludeIndex = tags.some(t => t.ai_index === false)

  // TODO implement skip-index

  const summary = await upsert(entry)
  const updated = {
    ...entry,
    ai_title: summary.title,
    ai_text: summary.summary,
    ai_sentiment: summary.emotion,
  }

  await db.executeStatement({
    sql: `update entries set ai_title=:ai_title, ai_text=:ai_text, ai_sentiment=:ai_sentiment
        where id=:id`,
    parameters: [
      {name: "ai_title", value: {stringValue: updated.ai_title}},
      {name: "ai_text", value: {stringValue: updated.ai_text}},
      {name: "ai_sentiment", value: {stringValue: updated.ai_sentiment}},
      {name: "id", value: {stringValue: entry.id}, typeHint: "UUID"}
    ]
  })

  // FIXME
  // entry.update_snoopers(d.db)

  return [{entry: updated, tags: req.tags}]
})
