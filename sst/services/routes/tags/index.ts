import {Routes} from '@gnothi/schemas'
import {Tag} from '@gnothi/schemas/tags'
import {db} from '../../data/db'

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
    update tags set name=:name, ai_index=:ai_index, ai_summary=:ai_summary, sort=:sort
    where user_id=:user_id and id=:id
    returning *;
    `,
    parameters: [
      {name: "name", value: {stringValue: req.name}},
      {name: "sort", value: {longValue: req.sort}},
      {name: "ai_index", value: {booleanValue: req.ai_index}},
      {name: "ai_summary", value: {booleanValue: req.ai_summarize}},
      {name: "user_id", value: {stringValue: context.user.id}, typeHint: "UUID"},
      {name: "id", value: {stringValue: req.id}, typeHint: "UUID"}
    ]
  })
  return tag
})
