import {z} from 'zod'
export * as Admin from './admin'
// @ts-ignore
import dayjs from 'dayjs'
import {Route, DefO} from "./api"
import {Passthrough} from "./utils";


export const admin_analytics_list_request = Passthrough
export type admin_analytics_list_request = z.infer<typeof admin_analytics_list_request>

const Measurements = z.object({
  count: z.number(),
  date: z.string()
}).array()
// export const admin_analytics_list_response = z.object({
//   id: z.string(),
//   users: Measurements,
//   users_returning: Measurements,
//   entries: Measurements,
//   notes: Measurements
// })
export const admin_analytics_list_response = Passthrough
export type admin_analytics_list_response = z.infer<typeof admin_analytics_list_response>

export const routes = {
  admin_analytics_list_request: {
    i: {
      e: 'admin_analytics_list_request',
      s: admin_analytics_list_request,
      snoopable: false,
      t: {ws: true},
    },
    o: {
      e: 'admin_analytics_list_response',
      s: admin_analytics_list_response,
      t: {ws: true},
      keyby: 'id'
    }
  },
}
