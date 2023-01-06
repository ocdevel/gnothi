import {z} from "zod";
import {Events} from "./events";
import type {Context} from 'aws-lambda'
import {Passthrough} from './utils'
import {User} from './users'
import type {APIGatewayProxyResultV2} from 'aws-lambda'

type RecordResult = APIGatewayProxyResultV2 | null

export type Trigger = {
  ws?: boolean // send the result to the websocket
  http?: boolean // send the result back as a standard http response
  // s3?: boolean // put the result into s3
  // background function. The function is this same wrapper framework, but is needed if we need to return
  // a value first ot the client (ws, http) and then kick off a background.
  background?: boolean
}

export type Def<T extends z.ZodTypeAny> = {
  s: T
  e: Events
  t?: Trigger
}
export type DefI<T extends z.ZodTypeAny> = Def<T> & {
  snoopable?: boolean
}
type ResOverrides = {
  keyby?: string
  event_as?: Events
  op?: "update" | "prepend" | "append" | "delete"
  // id?: string ???
  // uids?: string[] ???
}

export type DefO<T extends z.ZodTypeAny> = Def<T> & ResOverrides

export type FnContext = {
  user: User
  viewer: User
  snooping?: false
  everyone?: false

  requestId?: string
  finalRes?: unknown
  connectionId?: string
  handleRes: <T extends z.ZodTypeAny = any>(def: DefO<T>, res: Partial<Res<T>>, fnContext: FnContext) => Promise<RecordResult>
  handleReq: (req: Req, fnContext: FnContext) => Promise<RecordResult>
}
type FnDef<
  I extends z.ZodTypeAny,
  O extends z.ZodTypeAny
> = z.ZodFunction<
  z.ZodTuple<[I, ...z.ZodTypeAny[]], z.ZodUnknown>,
  z.ZodPromise<z.ZodArray<O>>
>
type Fn<
  I extends z.ZodTypeAny,
  O extends z.ZodTypeAny
> = (req: z.TypeOf<I>, extra: FnContext) => Promise<Array<z.TypeOf<O>>>

export class Route<
  I extends z.ZodTypeAny,
  O extends z.ZodTypeAny,
> {
  i: DefI<I>
  o: DefO<O>
  fnDef: FnDef<I, O>
  fn: Fn<I, O>
  constructor({i, o}: {i: DefI<I>, o: DefO<O>}) {
    this.i = {
      ...i,
      t: i.t || {ws: true}
    }
    this.o = {
      ...o,
      t: o.t || {ws: true},
      keyby: o.keyby || 'id',
    }
    this.fnDef = z.function()
      .args(i.s, z.any())
      .returns(o.s.array().promise())
    this.fn = async (req, context) => {
      throw Error(this.i.e + " function not implemented")
    }
  }
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
