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
  // id?: string ???
  // uids?: string[] ???
}

export type Def<T extends z.ZodTypeAny> = {
  s: T
  e: Events
  t?: Trigger
}
export type DefI<T extends z.ZodTypeAny> = Def<T> & {
  snoopable?: boolean
}

export type DefO<T extends z.ZodTypeAny> = Def<T> & ResOverrides

export type Route<I extends z.ZodTypeAny, O extends z.ZodTypeAny> = {
  i: DefI<I>
  o: DefO<O>
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
  as_user: z.string().uuid().optional(),
  data: AnyToObj,
})
export type Req = z.infer<typeof Req>

type Res_ = {
  event: Events
  code: number
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
