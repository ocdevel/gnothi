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
// Then, fix any stuck entries to pay it forward.
export const entries_upsert_response = new Route(r.entries_upsert_response, async (req, context) => {
  const res = entriesUpsertResponse(req, context)
  await fixStuckEntries(context)
  return res
})

// Separate this function out so that it can be called as the route, and as the job to update stuck entries.
// Both for the flexiblity to handle it differently, and because working with it directly wrapped as a Route causes
// all sorts of Zod woes.
async function entriesUpsertResponse(req: S.Entries.entries_upsert_response, context: FnContext) {
  const driz = context.db.drizzle
  const entry = req
  const eid = entry.id
  const tids = boolMapToKeys(entry.tags)
  const promises = []
  let updated = {...entry}
  let updates: Partial<Entry> = {}

  const tags_ = await driz.select()
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
    .catch(e => {
      // FIXME some entries are having trouble saving to .text_paras, I think due to quotes in the paras? Like
      // drizzle / pg-node aren't handling those. For now mark these as skip, and deal with later.
      console.error("Error updating entry", e)
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

async function fixStuckEntries(context: FnContext) {
  // re-set any entries whose ML got stuck in limbo. Do so for all users (pay it forward), so we can avoid a cron job.
  // This assumes some other script will pick up entries in the TODO state.
  // Entries get stuck if (a) a lambda timeout never finishes indexing/summarizing an entry, (b) between migrations,
  // when I manually set all entries to TODO. That's my trick to re-run all entries, while keeping the same framework

  // for (let i = 0; i < 10; i++) {
  //   const stuckEntry = await context.m.entries.getStuckEntry()
  //   // Detatch the context from whomever triggered this. That's because user.id might be referenced (eg, in fetching tags
  //   // in entriesUpsertResponse) and we don't want to send anything via websocket.
  //   const detachedContext = new FnContext({
  //     db: context.db,
  //     user: {id: stuckEntry.user_id},
  //     handleRes: context.handleRes,
  //     handleReq: context.handleReq
  //   })
  //   await entriesUpsertResponse(stuckEntry, detachedContext)
  // }


  // Processes stuck entries in batches. Ie, handle 2 at a time, until 10 are processed.
  const batchSize = 3
  const total = 10
  for (let i = 0; i < total; i += batchSize) {
    const promises = [];


    for (let j = 0; j < batchSize; j++) {
      console.log(`Fixing: ${i + j} of ${total} stuck entries`)
      const promise = context.m.entries.getStuckEntry().then(stuckEntry => {
        const detachedContext = new FnContext({
          db: context.db,
          user: {id: stuckEntry.user_id},
          handleRes: context.handleRes,
          handleReq: context.handleReq
        });

        return entriesUpsertResponse(stuckEntry, detachedContext);
      })
      promises.push(promise)
    }
    await Promise.all(promises)
  }


}
