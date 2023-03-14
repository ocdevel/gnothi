import * as S from '@gnothi/schemas'
import {db} from '../../data/db'
import {GnothiError} from "../errors";
import {upsert} from '../../ml/node/upsert'
import {preprocess} from '../../ml/node/preprocess'
import {summarize, summarizeEntry, SummarizeEntryOut} from '../../ml/node/summarize'
import {boolMapToKeys} from '@gnothi/schemas/utils'
import {sql} from "drizzle-orm/sql"

const r = S.Routes.routes

r.entries_upsert_response.fn = r.entries_upsert_response.fnDef.implement(async (req, context) => {
  const entry = req
  const eid = entry.id
  const tids = boolMapToKeys(entry.tags)
  const promises = []
  let updated = {...entry}

  const tags = await db.query<S.Tags.Tag>(
    sql`select * from tags where id in ${tids} and user_id=${context.user_id}`
  )

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
  promises.push(db.query(
    sql`update entries 
      set 
        text_clean=${updated.text_clean}, 
        text_paras=${updated.text_paras}::varchar[] 
      where id=${eid}`
  ))

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

  promises.push(db.query(
    sql`update entries set 
        ai_keywords=${updated.ai_keywords}::varchar[],
        ai_title=${updated.ai_title}, 
        ai_text=${updated.ai_text}, 
        ai_sentiment=${updated.ai_sentiment}
      where id=${eid}`
  ))
  await Promise.all(promises)

  // FIXME
  // entry.update_snoopers(d.db)

  return [{...updated, tags: req.tags}]
})
