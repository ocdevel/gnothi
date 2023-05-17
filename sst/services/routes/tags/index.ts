import {Routes} from '@gnothi/schemas'
import {tags, Tag} from '../../data/schemas/tags'
import {entriesTags, EntryTag} from '../../data/schemas/tags'
import {GnothiError} from "../errors";
import {Route} from '../types'
import {asc, eq, and} from 'drizzle-orm'
import {sql} from 'drizzle-orm'

const r = Routes.routes

export const tags_list_request = new Route(r.tags_list_request, async (req, context) => {
  const {vid, db} = context
  return db.drizzle.select().from(tags).where(eq(tags.user_id, vid)).orderBy(asc(tags.sort))
})

export const tags_post_request = new Route(r.tags_post_request, async (req, context) => {
  const {uid, db} = context
  return db.query<Tag>(sql`
    insert into ${tags} (name, user_id, sort) 
    values (
      ${req.name}, 
      ${uid},
      (select max(sort) + 1 as sort 
        from ${tags} where user_id=${uid})
    )
    returning *;
    `
  )
})

export const tags_put_request = new Route(r.tags_put_request, async (req, context) => {
  const {db, uid} = context
  return db.drizzle.update(tags).set({
    name: req.name,
    ai_index: req.ai_index,
    ai_summarize: req.ai_summarize,
    sort: req.sort
  })
    .where(and(eq(tags.user_id, uid), eq(tags.id, req.id)))
    .returning()
})

export const tags_delete_request = new Route(r.tags_delete_request, async (req, context) => {
  const {uid, db} = context
  const params = []
  const [tag, entries] = await Promise.all([
    db.query<Tag>(sql`select * from ${tags} where id=${req.id}`),
    db.query<any>(sql`select * from ${entries_tags} where tag_id=${req.id}`)
  ])
  if (tag[0].main) {
    throw new GnothiError({message: "Can't delete your main tag"})
  }
  if (entries?.length) {
    // TODO
    throw new GnothiError({message: "Can't delete tags which are applied to entries. Un-tag your entries first. I'll fix this eventually (by moving these entries to Main)."})
  }
  await db.query(sql`delete from ${tags} where id=${req.id}`)
  await context.handleReq({event: "tags_list_request", data: {}}, context)
  return null
})

export const tags_toggle_request = new Route(r.tags_toggle_request, async (req, context) => {
  const {uid, db} = context
  // update returning: https://stackoverflow.com/questions/7923237/return-pre-update-column-values-using-sql-only
  return db.query<Tag>(
    sql`update ${tags} x set selected=(not y.selected)
      from ${tags} y 
      where x.id=${req.id} and x.id=y.id
      returning x.*`
  )
})
