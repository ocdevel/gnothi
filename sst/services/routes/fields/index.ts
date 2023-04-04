import {Routes, Fields} from '@gnothi/schemas'
import {Route} from '../types'
import {Fields as FieldsModel} from '../../data/models/fields'
import {FieldEntries as FieldEntriesModel} from '../../data/models/fieldEntries'

const r = Routes.routes

export const fields_list_request = new Route(r.fields_list_request, async (req, context) => {
  return new FieldsModel(context.user.id).list()
})

export const fields_post_request = new Route(r.fields_post_request, async (req, context) => {
  // TODO add snooping
  return new FieldsModel(context.user.id).post(req)
})


export const fields_entries_list_request = new Route(r.fields_entries_list_request, async (req, context) => {
  return new FieldEntriesModel(context.user.id).list(req)
})

export const fields_entries_post_request = new Route(r.fields_entries_post_request, async (req, context) => {
  return new FieldEntriesModel(context.user.id).post(req)
})

