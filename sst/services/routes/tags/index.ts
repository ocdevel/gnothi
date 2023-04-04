import {Routes} from '@gnothi/schemas'
import {Tag} from '@gnothi/schemas/tags'
import {db} from '../../data/dbSingleton'
import {GnothiError} from "../errors";
import {Route} from '../types'
import {sql} from 'drizzle-orm/sql'

const r = Routes.routes

export const tags_list_request = new Route(r.tags_list_request, async (req, context) => {
  const tags = await db.query(
    sql`select * from tags where user_id=${context.user.id} order by sort asc`
  )
  return tags
})


export const tags_post_request = new Route(r.tags_post_request, async (req, context) => {
  const tag = await db.query(sql`
    insert into tags (name, user_id, sort) 
    values (
      ${req.name}, 
      ${context.user.id},
      (select max(sort) + 1 as sort 
        from tags where user_id=${context.user.id})
    )
    returning *;
    `
  )
  return tag
})

export const tags_put_request = new Route(r.tags_put_request, async (req, context) => {
  const tag = await db.query(sql`
    update tags set name=${req.name}, ai_index=${req.ai_index}, ai_summarize=${req.ai_summarize}, sort=${req.sort}
    where user_id=${context.user.id} and id=${req.id}
    returning *;
    `
  )
  return tag
})

export const tags_delete_request = new Route(r.tags_delete_request, async (req, context) => {
  const params = []
  const [tag, entries] = await Promise.all([
    db.query<Tag>(sql`select * from tags where id=${req.id}`),
    db.query<any>(sql`select * from entries_tags where tag_id=${req.id}`)
  ])
  if (tag[0].main) {
    throw new GnothiError({message: "Can't delete your main tag"})
  }
  if (entries?.length) {
    // TODO
    throw new GnothiError({message: "Can't delete tags which are applied to entries. Un-tag your entries first. I'll fix this eventually (by moving these entries to Main)."})
  }
  await db.query(sql`delete from tags where id=${req.id}`)
  await context.handleReq({event: "tags_list_request", data: {}}, context)
  return null
})

export const tags_toggle_request = new Route(r.tags_toggle_request, async (req, context) => {
  // update returning: https://stackoverflow.com/questions/7923237/return-pre-update-column-values-using-sql-only
  return db.query(
    sql`update tags x set selected=(not y.selected)
      from tags y 
      where x.id=${req.id} and x.id=y.id
      returning x.*`
  )
})
