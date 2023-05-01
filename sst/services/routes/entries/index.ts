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

const r = S.Routes.routes

export const entries_list_request = new Route(r.entries_list_request, async (req, context) => {
  return context.m.entries.filter(req)
})

export const entries_delete_request = new Route(r.entries_delete_request, async (req, context) => {
  return context.m.entries.destroy(req.id)
})


type UpsertInner = (entry: S.Entries.Entry & {user_id: string}) => Promise<S.Entries.Entry>
async function upsertOuter(
  req: S.Entries.entries_post_request,
  context: FnContext,
  upsertInner: UpsertInner
): Promise<S.Entries.entries_upsert_response[]> {
  const user_id = context.user.id
  const {tags, ...entry} = req
  const tids = boolMapToKeys(tags)
  if (!tids.length) {
    throw new GnothiError({message: "Each entry must belong to at least one journal", key: "NO_TAGS"})
  }
  const dbEntry = await upsertInner({...entry, user_id})
  const entry_id = dbEntry.id

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

  await db.drizzle.insert(entriesTags)
    .values(tids.map(tag_id => ({tag_id, entry_id})))
  // fixme gotta find a way to not need removeNull everywhere
  const ret = db.removeNull({...dbEntry, tags})
  return [ret]
}

export const entries_post_request = new Route(r.entries_post_request, async (req, context) => {
  const {drizzle} = context.db
  return upsertOuter(req, context, async (entry) => {
    const res = await drizzle.insert(entries).values(entry).returning()
    return res[0]
  })
})


export const entries_put_request = new Route(r.entries_put_request, async (req, context) => {
  const {id} = req
  const {db, s} = context
  return upsertOuter(req, context, async ({title, text, user_id}) => {
    // FIXME insecure. x-ref user-id with inner join
    await db.query(
      sql`delete from ${s.entriesTags} where entry_id=${id}`
    )
    const res = await db.drizzle.update(entries)
      .set({title, text})
      .where(and(eq(entries.id, id), eq(entries.user_id, user_id)))
      .returning()
    return res[0]
  })
})

export const entries_upsert_response = new Route(r.entries_upsert_response, async (req, context) => {
  const drizzle = context.db.drizzle
  const entry = req
  const eid = entry.id
  const tids = boolMapToKeys(entry.tags)
  const promises = []
  let updated = {...entry}

  const tags_ = await drizzle.select()
    .from(tags)
    .where(and(inArray(tags.id, tids), eq(tags.user_id, context.uid)))

  // TODO how to handle multiple tags, where some are yes-ai and some are no-ai?
  // For now I'm assuming no.
  const skip_summarize = tags_.some(t => t.ai_summarize === false)
  const skip_index = tags_.some(t => t.ai_index === false)

  const clean = await preprocess({text: entry.text, method: 'md2txt'})

  // save clean/paras right away so they can be used by insights
  updated = {
    ...updated,
    text_clean: clean.text,
    text_paras: clean.paras
  }
  promises.push(drizzle.update(entries)
    .set({
      text_clean: updated.text_clean,
      text_paras: updated.text_paras // varchar[]
    })
    .where(eq(entries.id, eid)))

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


  promises.push(drizzle.update(entries)
    .set({
      ai_keywords: updated.ai_keywords, // varchar[],
      ai_title: updated.ai_title,
      ai_text: updated.ai_text,
      ai_sentiment: updated.ai_sentiment
    })
    .where(eq(entries.id, eid)))

  await Promise.all(promises)

  // FIXME
  // entry.update_snoopers(d.db)

  return [{...updated, tags: req.tags}]
})
