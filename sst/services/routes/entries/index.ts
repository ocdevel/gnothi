import * as S from '@gnothi/schemas'
import {db} from '../../data/db'
import {GnothiError} from "../errors";
import {z} from 'zod'
import {reduce as _reduce} from "lodash"
import {Function} from "@serverless-stack/node/function"
import {lambdaSend} from '../../aws/handlers'

const r = S.Routes.routes
const fnAnalyze = Function.fn_analyze.functionName

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
  dbEntry.text_summary = "Text Summary"
  dbEntry.title_summary = "Title Summary"
  dbEntry.sentiment = "Sentiment"

  const entryAsDoc = {
    name: dbEntry.title || dbEntry.text.slice(0, 140),
    content: dbEntry.text,
    obj_id: dbEntry.id,
    parent_id: dbEntry.user_id
  }

  // TODO clean this up
  context.handleRes(
    r.entries_upsert_request.o,
    {event: "entries_upsert_response", data: [{entry: dbEntry, tags}], error: false, code: 200, keyby: 'entry.id'},
    context
  )

  const upsert = lambdaSend(
    {event: "upsert", data: {docs: [entryAsDoc], params: {}}},
    fnAnalyze,
    "RequestResponse"
  )

  const title = lambdaSend(
    {event: "summarize", data: {docs: [entryAsDoc], params: {min_length: 20, max_length: 80}}},
    fnAnalyze,
    "RequestResponse"
  )

  const summary = lambdaSend(
    {event: "summarize", data: {docs: [entryAsDoc], params: {min_length: 100, max_length: 300}}},
    fnAnalyze,
    "RequestResponse"
  )

  const keywords = lambdaSend(
    {event: "keywords", data: {docs: [entryAsDoc], params: {top_n: 5}}},
    fnAnalyze,
    "RequestResponse"
  )

  const final = await Promise.all([upsert, title, summary, keywords])
  debugger

  // FIXME
  // entry.update_snoopers(d.db)
  //M.Entry.run_models(db, entry)

  return [{entry: dbEntry, tags}]
})


// r.entries_upsert_response.fn = r.entries_upsert_response.fnDef.implement(async (req, context) => {
