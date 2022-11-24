import {z} from "zod";
import {Events} from "./events";
import type {Context} from 'aws-lambda'
import {Passthrough} from './utils'
import type {User} from './users'

export type Trigger = {
  ws?: boolean
  http?: boolean
  s3?: boolean
  rds?: boolean
  steps?: Events[]
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

  connectionId?: string
  handleRes: (triggers: Trigger, res: Res, fnContext: FnContext) => void
  handleReq: (req: Req, fnContext: FnContext) => void
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
    // this.fn = async (req, context) => {
    //   throw Error(this.i.e + " function not implemented")
    // }
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
  data: AnyToObj
})
export type Req = z.infer<typeof Req>

export type ResError = {
  event: Events
  error: true
  code: number
  data: string
}
export type ResSuccess<T = unknown> = ResOverrides & {
  event: Events
  error: false
  code: number
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
