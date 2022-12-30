import * as S from '@gnothi/schemas'
import {db} from '../../data/db'
import {GnothiError} from "../errors";
import {upsert} from '../../ml/node/upsert'
import {preprocess} from '../../ml/node/preprocess'
import {summarize, summarizeEntry, SummarizeEntryOut} from '../../ml/node/summarize'
import {boolMapToKeys} from '@gnothi/schemas/utils'

const r = S.Routes.routes

r.entries_upsert_response.fn = r.entries_upsert_response.fnDef.implement(async (req, context) => {
  const {entry} = req
  const eid = entry.id
  const tids = boolMapToKeys(req.tags)
  const promises = []
  let updated = {...entry}

  const tags = await db.executeStatement<S.Tags.Tag>({
    sql: `select * from tags where id in :tids and user_id=:user_id`,
    parameters: [
      {name: "tids", typeHint: "UUID", value: {arrayValue: {stringValues: tids}}},
      {name: "user_id", typeHint: "UUID", value: {stringValue: context.user.id}}
    ]
  })

  // TODO how to handle multiple tags, where some are yes-ai and some are no-ai?
  // For now I'm assuming no.
  const skip_summarize = tags.some(t => t.ai_summarize === false)
  const skip_index = tags.some(t => t.ai_index === false)

  const clean = await preprocess({text: entry.text, method: 'md2txt'})

  // save clean/paras right away so they can be used by insights
  updated = {
    ...updated,
    text_clean: clean.text,
    text_paras: clean.paras
  }
  promises.push(db.executeStatement({
    sql: `update entries 
      set 
        text_clean=:text_clean, 
        text_paras=:text_paras::varchar[] 
      where id=:id`,
    parameters: [
      {name: "text_clean", value: {stringValue: updated.text_clean}},
      {name: "text_paras", value: {arrayValue: {stringValues: updated.text_paras}}, arrayFix: "="},
      {name: "id", value: {stringValue: eid}, typeHint: "UUID"}
    ]
  }))

  const summary = !skip_summarize ? await summarizeEntry(clean) : {
    title: "",
    paras: clean.paras,
    body: {text: clean.text, emotion: "", keywords: []}
  }

  updated = {
    ...updated,
    ai_title: summary.title,
    ai_text: summary.body.text,
    ai_sentiment: summary.body.emotion,
    ai_keywords: summary.body.keywords
  }


  if (!skip_index) {
    promises.push(upsert({entry: updated}))
  }

  // FIXME save keywords, getting error (I think due to rds data api + arrays):
  // ERROR: column "ai_keywords" is of type character varying[] but expression is of type record
  //   Hint: You will need to rewrite or cast the expression.
  promises.push(db.executeStatement({
    sql: `update entries set 
        ai_keywords=:ai_keywords::varchar[],
        ai_title=:ai_title, 
        ai_text=:ai_text, 
        ai_sentiment=:ai_sentiment
      where id=:id`,
    parameters: [
      {name: "ai_title", value: {stringValue: updated.ai_title}},
      {name: "ai_text", value: {stringValue: updated.ai_text}},
      {name: "ai_sentiment", value: {stringValue: updated.ai_sentiment}},
      {name: "ai_keywords", value: {arrayValue: {stringValues: updated.ai_keywords}}, arrayFix: "="},
      {name: "id", value: {stringValue: eid}, typeHint: "UUID"}
    ]
  }))
  await Promise.all(promises)

  // FIXME
  // entry.update_snoopers(d.db)

  return [{entry: updated, tags: req.tags}]
})
