import {Routes} from '@gnothi/schemas'
import {tags, Tag} from '../../data/schemas/tags'
import {entriesTags, EntryTag} from '../../data/schemas/entriesTags'
import {GnothiError} from "../errors";
import {Route} from '../types'
import {asc, eq, and} from 'drizzle-orm'
import {sql} from 'drizzle-orm'
import * as S from "@gnothi/schemas";

const r = Routes.routes

export const tags_list_request = new Route(r.tags_list_request, async (req, context) => {
  const {vid, db} = context
  return context.m.tags.list()
})

export const tags_post_request = new Route(r.tags_post_request, async (req, context) => {
  const count = await context.db.query(sql`
    SELECT count(*) > 100 as too_many 
    FROM tags WHERE user_Id=${context.uid}`)
  if (count[0].too_many) {
    throw new GnothiError({message: "Too many tags. Are you intending to use the Notes feature? Find that by opening a journal entry", code: 400})
  }
  return context.m.tags.post(req)
})

export const tags_put_request = new Route(r.tags_put_request, async (req, context) => {
  const {db, uid} = context
  return context.m.tags.put(req)
})

export const tags_delete_request = new Route(r.tags_delete_request, async (req, context) => {
  const {uid, db} = context
  return context.m.tags.destroy(req)
})

export const tags_toggle_request = new Route(r.tags_toggle_request, async (req, context) => {
  const {uid, db} = context
  return context.m.tags.toggle(req)
})

export const tags_sort_request = new Route(r.tags_sort_request, async (req, context) => {
  const {uid, db: {drizzle}} = context
  return context.m.tags.reorder(req)
})