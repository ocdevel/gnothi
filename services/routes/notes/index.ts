import {Routes} from '@gnothi/schemas'
import {Route} from '../types'

const r = Routes.routes

export const entries_notes_list_request = new Route(r.entries_notes_list_request,async function(req, context) {
  return context.m.notes.list(req)
})

export const entries_notes_post_request = new Route(r.entries_notes_post_request,async function(req, context) {
  return context.m.notes.post(req)
})
