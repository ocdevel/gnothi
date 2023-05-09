import {Route, FnContext} from '../types'
import * as S from '@gnothi/schemas'
import {boolMapToKeys} from '@gnothi/schemas/utils'
import {GnothiError} from "../errors";
import {db} from "../../data/dbSingleton";
import {entriesTags} from "../../data/schemas/entriesTags";
import {entries, Entry} from "../../data/schemas/entries";
import {tags, Tag} from "../../data/schemas/tags";
import {sql} from "drizzle-orm/sql";
import {preprocess} from "../../ml/node/preprocess";
import {summarizeEntry} from "../../ml/node/summarize";
import {upsert} from "../../ml/node/upsert";
import {eq, and, inArray} from "drizzle-orm/expressions"
import * as _ from 'lodash'
import {containsListTokenElement} from "aws-cdk-lib/core/lib/private/encoding";

const r = S.Routes.routes

export const entries_list_request = new Route(r.entries_list_request, async (req, context) => {
  return context.m.entries.filter(req)
})

export const entries_delete_request = new Route(r.entries_delete_request, async (req, context) => {
  return context.m.entries.destroy(req.id)
})

export const entries_post_request = new Route(r.entries_post_request, async (req, context) => {
  return context.m.entries.post(req)
})

export const entries_put_request = new Route(r.entries_put_request, async (req, context) => {
  return context.m.entries.put(req)
})

export const entries_upsert_response = new Route(r.entries_upsert_response, async (req, context) => {
  const drizzle = context.db.drizzle
  const entry = req
  const eid = entry.id
  const tids = boolMapToKeys(entry.tags)
  const promises = []
  let updated = {...entry}
  let updates: Partial<Entry> = {}

  const tags_ = await drizzle.select()
    .from(tags)
    .where(and(inArray(tags.id, tids), eq(tags.user_id, context.uid)))

  // TODO how to handle multiple tags, where some are yes-ai and some are no-ai?
  // For now I'm assuming no.
  const skip_summarize = tags_.some(t => t.ai_summarize === false)
  const skip_index = tags_.some(t => t.ai_index === false)

  const clean = await preprocess({text: entry.text, method: 'md2txt'})

  const summary = !skip_summarize ? await summarizeEntry(clean) : {
    title: "",
    paras: clean.paras,
    body: {text: "", emotion: "", keywords: []}
  }
  console.log({summary})

  updates = {
    text_clean: clean.text,
    text_paras: clean.paras,
    ai_title: summary.title,
    ai_text: summary.body.text,
    ai_sentiment: summary.body.emotion,
    ai_keywords: summary.body.keywords,
    ai_index_state: "done"
  }
  updated = {...entry, ...updates}

  if (!skip_index) {
    promises.push(upsert({entry: updated}))
  }

  promises.push(drizzle.update(entries)
    .set(updates)
    .where(eq(entries.id, eid)))

  await Promise.all(promises)

  // FIXME
  // entry.update_snoopers(d.db)

  return [{...updated, tags: req.tags}]
})
