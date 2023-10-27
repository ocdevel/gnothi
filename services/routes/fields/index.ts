import {Routes, Fields} from '@gnothi/schemas'
import {Route} from '../types'
import {Fields as FieldsModel} from '../../data/models/fields'
import {tableQa} from "../../ml/node/tableqa";
import {ulid} from 'ulid'
import {GnothiError} from "../errors.js";
import {fields} from "../../data/schemas/fields.js";
import {eq} from "drizzle-orm";

const r = Routes.routes

export const fields_list_request = new Route(r.fields_list_request, async (req, context) => {
  return context.m.fields.list()
})

export const fields_post_request = new Route(r.fields_post_request, async (req, context) => {
  // TODO add snooping
  return context.m.fields.post(req)
})

export const fields_put_request = new Route(r.fields_put_request, async (req, context) => {
  return context.m.fields.put(req)
})

export const fields_delete_request = new Route(r.fields_delete_request, async (req, context) => {
  return context.m.fields.delete(req)
})

export const fields_sort_request = new Route(r.fields_sort_request, async (req, context) => {
  return context.m.fields.sort(req)
})

export const fields_entries_list_request = new Route(r.fields_entries_list_request, async (req, context) => {
  return context.m.fields.entriesList(req)
})

export const fields_entries_post_request = new Route(r.fields_entries_post_request, async (req, context) => {
  const {uid, db: {drizzle}, user: {score}} = context

  const updates = await context.m.fields.entriesPost(req)
  const {user_update, field_update, field_entry_update} = updates[0]

  if (user_update.score === score && field_update.lane === "reward") {
    throw new GnothiError({message: "Not enough points"})
  }

  await Promise.all([
    context.handleRes(
      {...r.users_list_request.o, op: "update"},
      {data: [user_update]},
      context
    ),
    context.handleRes(
      {...r.fields_list_request.o, op: "update"},
      {data: [field_update]},
      context
    )
  ])
  return [field_entry_update]
})

export const fields_exclude_request = new Route(r.fields_exclude_request, async (req, context) => {
  return context.m.fields.put({
    id: req.id,
    excluded_at: req.exclude ? new Date() : null
  })
})

export const fields_influencers_list_request = new Route(r.fields_influencers_list_request, async (req, context) => {
  return context.m.fields.influencersList()
})

export const fields_history_list_request = new Route(r.fields_history_list_request, async (req, context) => {
  return context.m.fields.historyList(req)
})

export const fields_ask_request = new Route(r.fields_ask_request, async (req, context) => {
  return [{...req, user_id: context.uid}]
})
export const fields_ask_response = new Route(r.fields_ask_response, async (req, context) => {
  const res = await tableQa(req)
  return [{id: ulid(), ...res}]
})