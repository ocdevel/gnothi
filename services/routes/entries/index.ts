import {Route, FnContext} from '../types'
import * as S from '@gnothi/schemas'
import {boolMapToKeys} from '@gnothi/schemas/utils'
import {GnothiError} from "../errors";
import {db} from "../../data/dbSingleton";
import {entriesTags} from "../../data/schemas/entriesTags";
import {entries, Entry} from "../../data/schemas/entries";
import {tags, Tag} from "../../data/schemas/tags";
import {sql} from "drizzle-orm";
import {preprocess} from "../../ml/node/preprocess";
import {summarizeEntry} from "../../ml/node/summarize";
import {upsert} from "../../ml/node/upsert";
import {eq, and, inArray} from "drizzle-orm"
import * as _ from 'lodash'
import {Logger} from "../../aws/logs";
import dayjs from "dayjs";

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

// Handle the background-job after an entry has been upserted. That is, apply summarization, emotions, indexing, etc.
// Separate function like this because users_everything_response needs entriesUpsertResponse() exported below too.
export const entries_upsert_response = new Route(r.entries_upsert_response, async (req, context) => {
  return entriesUpsertResponse(req, context)
})

// Separate this function out so that it can be called as the route, and as the job to update stuck entries.
// Both for the flexiblity to handle it differently, and because working with it directly wrapped as a Route causes
// all sorts of Zod woes.
export async function entriesUpsertResponse(req: S.Entries.entries_upsert_response, context: FnContext) {
  const driz = context.db.drizzle
  const entry = req
  const eid = entry.id
  const tids = boolMapToKeys(entry.tags)
  const promises = []
  let updated = {...entry}
  let updates: Partial<Entry> = {}
  const {user} = context

  const tags_ = await driz.select()
    .from(tags)
    .where(and(inArray(tags.id, tids), eq(tags.user_id, context.uid)))

  // TODO how to handle multiple tags, where some are yes-ai and some are no-ai?
  // For now I'm assuming no.
  let skip_summarize = tags_.some(t => t.ai_summarize === false)
  let skip_index = tags_.some(t => t.ai_index === false)

  if (entry.text.length < 100) {
    // Too little to work with, even if they specify. Skip it to avoid ML issues (embedding, parquet, summary, etc).
    skip_index = true
    skip_summarize = true
  }
  
  const clean = await preprocess({text: entry.text, method: 'md2txt'})

  const summary = skip_summarize ? {
    title: "",
    paras: clean.paras,
    body: {text: "", emotion: "", keywords: []}
  } : await summarizeEntry(clean)
  //console.log({summary})

  updates = {
    text_clean: clean.text,
    text_paras: clean.paras,
    ai_title: summary.title,
    ai_text: summary.body.text,
    ai_sentiment: summary.body.emotion,
    ai_keywords: summary.body.keywords,
    ai_index_state: skip_index ? "skip" : "done",
    ai_summarize_state: skip_summarize ? "skip" : "done",
    updated_at: new Date()
  }
  updated = {...entry, ...updates}

  if (!skip_index) {
    promises.push(upsert({entry: updated}))
  }

  const updateEntry = driz.update(entries)
    .set(updates)
    .where(eq(entries.id, eid))
    .catch(error => {
      // FIXME some entries are having trouble saving to .text_paras, I think due to quotes in the paras? Like
      // drizzle / pg-node aren't handling those. For now mark these as skip, and deal with later.
      Logger.error("entries_upsert_response", {error, updates})
      const {text_paras, ...rest} = updates
      return driz.update(entries).set({
        ...rest,
        ai_summarize_state: "skip",
        ai_index_state: "skip"
      }).where(eq(entries.id, eid))
    })
  promises.push(updateEntry)

  await Promise.all(promises)

  // FIXME
  // entry.update_snoopers(d.db)

  return [{...updated, tags: req.tags}]
}
