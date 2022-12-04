import * as S from '@gnothi/schemas'
import {db} from '../../data/db'
import {GnothiError} from "../errors";
import {Function} from "@serverless-stack/node/function"
import {lambdaSend} from '../../aws/handlers'
import {weaviateClient, weaviateDo} from '../../data/weaviate'

const r = S.Routes.routes
const fnSummarize = Function.fn_summarize.functionName
const fnKeywords = Function.fn_keywords.functionName

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

  const entryAsDoc = {
    name: dbEntry.title || dbEntry.text.slice(0, 140),
    content: dbEntry.text,
    obj_id: dbEntry.id,
    parent_id: dbEntry.user_id
  }

  const sendRes = context.handleRes(
    r.entries_upsert_request.o,
    {event: "entries_upsert_response", data: [{entry: dbEntry, tags}], error: false, code: 200, keyby: 'entry.id'},
    context
  )
  const upsert = weaviateDo(weaviateClient.data
    .creator()
    .withClassName("Object")
    .withProperties(entryAsDoc)
  )
  const title = lambdaSend(
    {text: entryAsDoc.content, params: {min_length: 20, max_length: 80}},
    fnSummarize,
    "RequestResponse"
  )
  const summary = lambdaSend(
    {text: entryAsDoc.content, params: {min_length: 100, max_length: 300}},
    fnSummarize,
    "RequestResponse"
  )
  const keywords = lambdaSend(
    {text: entryAsDoc.content, params: {top_n: 5}},
    fnKeywords,
    "RequestResponse"
  )

  const final = await Promise.all([sendRes, upsert, title, summary, keywords])

  const updated = {
    ...dbEntry,
    title_summary: final[2].Payload as unknown as string,
    text_summary: final[3].Payload as unknown as string
  }

  await db.executeStatement({
    sql: `update entries set title_summary=:title_summary, text_summary=:text_summary
        where entry_id=:entry_id`,
    parameters: [
      {name: "title_summary", value: {stringValue: updated.title_summary}},
      {name: "text_summary", value: {stringValue: updated.text_summary}},
      {name: "entry_id", value: {stringValue: dbEntry.id}, typeHint: "UUID"}
    ]
  })

  // FIXME
  // entry.update_snoopers(d.db)
  //M.Entry.run_models(db, entry)

  return [{entry: updated, tags}]
})
