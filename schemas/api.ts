import {z} from "zod";
import {Events} from "./events";
import {Passthrough} from './utils'

export type Trigger = {
  ws?: boolean // send the result to the websocket
  http?: boolean // send the result back as a standard http response
  // s3?: boolean // put the result into s3
  // background function. The function is this same wrapper framework, but is needed if we need to return
  // a value first ot the client (ws, http) and then kick off a background.
  background?: boolean
}

export type ResOverrides = {
  keyby?: string
  event_as?: Events
  op?: "update" | "prepend" | "append" | "delete"
  clears?: Events // if something was a request, tell it it's done fetching
  // id?: string ???
  // uids?: string[] ???
}

export type Def<T extends z.ZodTypeAny, E extends Events> = {
  s: T
  e: E
  t?: Trigger
}
export type DefI<T extends z.ZodTypeAny, E extends Events> = Def<T, E> & {
  snoopable?: boolean
}

export type DefO<T extends z.ZodTypeAny, E extends Events> = Def<T, E> & ResOverrides

export type Route<I extends z.ZodTypeAny, O extends z.ZodTypeAny, EI extends Events, EO extends Events> = {
  i: DefI<I, EI>
  o: DefO<O, EO>
}

export const AnyToObj = z.preprocess(
  (val) => {
    if (!val) {return {}}
    if (typeof val === 'string') { return JSON.parse(val) }
    return val
  },
  Passthrough // json object
    .or(Passthrough.array()) // list of json objects
    .or(Passthrough.array().array()) // jsonl
)
export const Req = z.object({
  event: Events,
  trigger: z.enum(['ws', 'http', 'sns', 's3', 'lambda']).optional(),
  data: AnyToObj,
  as_user: z.string().uuid().optional(),
})
export type Req = z.infer<typeof Req>

// FIXME follow the `E extends Events` pattern from above. See bottom of this file for larger explaination
type Res_ = {
  event: Events
  code: number
  // When sending chunks of data via websockets, we need to track (1) the progress, (2) are
  // we still buffering from the same response batch
  responseId?: string
  chunk?: {
    i: number
    of: number
  }
}
export type ResError = Res_ & {
  error: true
  data: string
}
export type ResSuccess<T = unknown> = Res_ & ResOverrides & {
  error: false
  data: T[]
}
export type Res<T = unknown> = ResSuccess<T> | ResError

// const routes_: {[k in Events]?: Def} = routes

export type ResUnwrap<T> = {
  res: Res<T[]>
  rows: T[]
  first: T
  hash: {[k: string]: T}
  ids: string[]
}
