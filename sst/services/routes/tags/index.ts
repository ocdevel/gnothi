import {Routes} from '@gnothi/schemas'
import {Tag} from '@gnothi/schemas/tags'
import {db} from '../../data/db'
import {GnothiError} from "../errors";

const r = Routes.routes

r.tags_list_request.fn = r.tags_list_request.fnDef.implement(async (req, context) => {
  const tags = await db.query(
    'select * from tags where user_id=$1 order by sort asc',
    [
      context.user.id
    ]
  )
  return tags
})


r.tags_post_request.fn = r.tags_post_request.fnDef.implement(async (req, context) => {
  const tag = await db.query(`
    insert into tags (name, user_id, sort) 
    values (
      $1, 
      $2,
      (select max(sort) + 1 as sort 
        from tags where user_id=$2)
    )
    returning *;
    `,
    [
      req.name,
      context.user.id
    ]
  )
  return tag
})

r.tags_put_request.fn = r.tags_put_request.fnDef.implement(async (req, context) => {
  const tag = await db.query(`
    update tags set name=$1, ai_index=$2, ai_summarize=$3, sort=$4
    where user_id=$5 and id=$6
    returning *;
    `,
    [
      req.name,
      req.ai_index,
      req.ai_summarize,
      req.sort,
      context.user.id,
      req.id
    ]
  )
  return tag
})

r.tags_delete_request.fn = r.tags_delete_request.fnDef.implement(async (req, context) => {
  const params = [req.id]
  const [tag, entries] = await Promise.all([
    db.query<Tag>("select * from tags where id=$1", params),
    db.query<any>("select * from entries_tags where tag_id=$1", params)
  ])
  if (tag[0].main) {
    throw new GnothiError({message: "Can't delete your main tag"})
  }
  if (entries?.length) {
    // TODO
    throw new GnothiError({message: "Can't delete tags which are applied to entries. Un-tag your entries first. I'll fix this eventually (by moving these entries to Main)."})
  }
  await db.query("delete from tags where id=$1", params)
  await context.handleReq({event: "tags_list_request", data: {}}, context)
  return null
})

r.tags_toggle_request.fn = r.tags_toggle_request.fnDef.implement(async (req, context) => {
  // update returning: https://stackoverflow.com/questions/7923237/return-pre-update-column-values-using-sql-only
  return db.query(
    `update tags x set selected=(not y.selected)
      from tags y 
      where x.id=$1 and x.id=y.id
      returning x.*`,
    [req.id]
  )
})
