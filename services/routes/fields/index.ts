import {Routes, Fields} from '@gnothi/schemas'
import {Route} from '../types'
import {Fields as FieldsModel} from '../../data/models/fields'
import {tableQa} from "../../ml/node/tableqa";

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

export const fields_entries_list_request = new Route(r.fields_entries_list_request, async (req, context) => {
  return context.m.fields.entriesList(req)
})

export const fields_entries_post_request = new Route(r.fields_entries_post_request, async (req, context) => {
  return context.m.fields.entriesPost(req)
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
  console.log("fields_ask_request")
  return [req]
})
export const fields_ask_response = new Route(r.fields_ask_response, async (req, context) => {
  const res = await tableQa({
    user_id: context.uid,
    query: req.query
  })
  return [{id: Date.now(), ...res}]
})