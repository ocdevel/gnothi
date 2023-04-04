import {Routes} from '@gnothi/schemas'
import {DB} from '../../data/db'
import {Route} from '../types'

const r = Routes.routes

export const notifs_groups_list_request = new Route(r.notifs_groups_list_request, async (req, context) => {
  return []
})

export const notifs_notes_list_request = new Route(r.notifs_notes_list_request, async (req, context) => {
  return []
})
