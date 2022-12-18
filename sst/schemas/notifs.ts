import {Route} from "./api";
import {dateCol, IdCol, Passthrough} from "./utils";
import {z} from "zod";

export * as Notifs from './notifs'

export const Notif = z.object({
  user_id: IdCol,
  obj_id: IdCol,
  count: z.number().default(0),
  last_seen: dateCol()
})
export type Notif = z.infer<typeof Notif>

export const notifs_notes_list_response = Notif
export type notifs_notes_list_response = z.infer<typeof notifs_notes_list_response>

export const routes = {
  notifs_groups_list_request: new Route({
    i: {
      e: 'notifs_groups_list_request',
      s: Passthrough,
    },
    o: {
      e: 'notifs_groups_list_response',
      s: Notif,
      keyby: "obj_id"
    },
  }),
  notifs_notes_list_request: new Route({
    i: {
      e: 'notifs_notes_list_request',
      s: Passthrough,
    },
    o: {
      e: 'notifs_notes_list_response',
      s: Notif,
      keyby: "obj_id"
    },
  }),
  notifs_shares_list_request: new Route({
    i: {
      e: 'notifs_shares_list_request',
      s: Passthrough,
    },
    o: {
      e: 'notifs_shares_list_response',
      s: Notif,
      keyby: "obj_id"
    },
  })
}
