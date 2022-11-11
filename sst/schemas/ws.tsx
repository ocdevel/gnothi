import {z} from 'zod'
import {Passthrough, IdCol, DateCol} from "./utils";
import {Route} from './api'
export * as Ws from './ws'

export const WsConnection = z.object({
  user_id: z.string().uuid(),
  connection_id: z.string()
})
export type WsConnection = z.infer<typeof WsConnection>

export const routes = {
  wipe_request: new Route({
    i: {
      s: Passthrough,
      e: 'wipe_request',
      t: {ws: true},
    },
    o: {
      s: Passthrough,
      e: 'void',
      t: {ws: true},
    }
  })
}
