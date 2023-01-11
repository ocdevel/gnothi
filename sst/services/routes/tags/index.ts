import {Routes} from '@gnothi/schemas'
import {Tag} from '@gnothi/schemas/tags'
import {db} from '../../data/db'
import {GnothiError} from "../errors";

const r = Routes.routes

r.tags_list_request.fn = r.tags_list_request.fnDef.implement(async (req, context) => {
  const tags = await db.executeStatement({
    sql: 'select * from tags where user_id=:user_id order by sort asc',
    parameters: [
      {name: "user_id", value: {stringValue: context.user.id}, typeHint: "UUID"}
    ]
  })
  return tags
})


r.tags_post_request.fn = r.tags_post_request.fnDef.implement(async (req, context) => {
  const tag = await db.executeStatement({
    sql: `
    insert into tags (name, user_id, sort) 
    values (
      :name, 
      :user_id,
      (select max(sort) + 1 as sort 
        from tags where user_id=:user_id)
    )
    returning *;
    `,
    parameters: [
      {name: "name", value: {stringValue: req.name}},
      {name: "user_id", value: {stringValue: context.user.id}, typeHint: "UUID"}
    ]
  })
  return tag
})

r.tags_put_request.fn = r.tags_put_request.fnDef.implement(async (req, context) => {
  const tag = await db.executeStatement({
    sql: `
    update tags set name=:name, ai_index=:ai_index, ai_summarize=:ai_summarize, sort=:sort
    where user_id=:user_id and id=:id
    returning *;
    `,
    parameters: [
      {name: "name", value: {stringValue: req.name}},
      {name: "sort", value: {longValue: req.sort}},
      {name: "ai_index", value: {booleanValue: req.ai_index}},
      {name: "ai_summarize", value: {booleanValue: req.ai_summarize}},
      {name: "user_id", value: {stringValue: context.user.id}, typeHint: "UUID"},
      {name: "id", value: {stringValue: req.id}, typeHint: "UUID"}
    ]
  })
  return tag
})

r.tags_delete_request.fn = r.tags_delete_request.fnDef.implement(async (req, context) => {
  const parameters = [
    {name: "id", typeHint: "UUID", value: {stringValue: req.id}}
  ]
  const [tag, entries] = await Promise.all([
    db.executeStatement<Tag>({sql: "select * from tags where id=:id", parameters}),
    db.executeStatement<any>({sql: "select * from entries_tags where tag_id=:id", parameters})
  ])
  if (tag[0].main) {
    throw new GnothiError({message: "Can't delete your main tag"})
  }
  if (entries?.length) {
    // TODO
    throw new GnothiError({message: "Can't delete tags which are applied to entries. Un-tag your entries first. I'll fix this eventually (by moving these entries to Main)."})
  }
  await db.executeStatement({sql: "delete from tags where id=:id", parameters})
  await context.handleReq({event: "tags_list_request", data: {}}, context)
  return null
})

r.tags_toggle_request.fn = r.tags_toggle_request.fnDef.implement(async (req, context) => {
  return await db.executeStatement({
    sql: `update tags set selected=(not sub.selected)
      from (select selected from tags where id=:id) as sub 
      where id=:id
      returning *`,
    parameters: [
      {name: "id", value: {stringValue: req.id}, typeHint: "UUID"}
    ]
  })
})
