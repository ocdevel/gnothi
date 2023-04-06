import {Routes, Fields} from '@gnothi/schemas'
import {Route} from '../types'
import {Fields as FieldsModel} from '../../data/models/fields'
import {FieldEntries as FieldEntriesModel} from '../../data/models/fieldEntries'

const r = Routes.routes

export const fields_list_request = new Route(r.fields_list_request, async (req, context) => {
  return context.m.fields.list()
})

export const fields_post_request = new Route(r.fields_post_request, async (req, context) => {
  // TODO add snooping
  return context.m.fields.post(req)
})


export const fields_entries_list_request = new Route(r.fields_entries_list_request, async (req, context) => {
  return context.m.fields.entriesList(req)
})

export const fields_entries_post_request = new Route(r.fields_entries_post_request, async (req, context) => {
  return context.m.fields.entriesPost()
})

