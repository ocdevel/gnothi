import * as S from '@gnothi/schemas'
import * as M from '../../data/models'
import {Route, FnContext} from '../types'
import {boolMapToKeys} from '@gnothi/schemas/utils'
import {GnothiError} from "../errors";
import {db} from "../../data/dbSingleton";
import {entriesTags} from "../../data/schemas/entriesTags";
import {entries} from "../../data/schemas/entries";
import {sql} from "drizzle-orm/sql";
import {preprocess} from "../../ml/node/preprocess";
import {summarizeEntry} from "../../ml/node/summarize";
import {upsert} from "../../ml/node/upsert";

const r = S.Routes.routes

export const entries_list_request = new Route(r.entries_list_request, async (req, context) => {
  const mEntries = new M.Entries(context.user.id)
  return mEntries.filter(req)
})

export const entries_delete_request = new Route(r.entries_delete_request, async (req, context) => {
  const mEntries = new M.Entries(context.user.id)
  return mEntries.destroy(req.id)
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

  // TODO use batchExecuteStatement
  for (const tag_id of tids) {
    // FIXME
    await db.drizzle.insert(entriesTags).values({tag_id, entry_id})
  }

  return [{...dbEntry, tags}]
}

export const entries_post_request = new Route(r.entries_post_request, async (req, context: S.Api.FnContext) => {
  return upsertOuter(req, context, async (entry) => {
    return db.drizzle.insert(entries).values(entry)
  })
})


export const entries_put_request = new Route(r.entries_put_request, async (req, context: S.Api.FnContext) => {
  const {id} = req
  return upsertOuter(req, context, async ({title, text, user_id}) => {
    // FIXME insecure. x-ref user-id with inner join
    await db.query(
      sql`delete from entries_tags where entry_id=${id}`
    )
    return db.queryFirst<S.Entries.Entry>(sql`
      update entries set title=${title}, text=${text} 
      where id=${id} and user_id=${user_id} 
      returning *
    `)
  })
})

export const entries_upsert_response = new Route(r.entries_upsert_response, async (req, context) => {
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
