import type {APIGatewayProxyResultV2} from 'aws-lambda'
import {z} from "zod";
import {User} from '../data/schemas/users'
import {Events} from '@gnothi/schemas/events'
import {
  Req,
  Res,
  Trigger,
  DefI,
  DefO,
  ResOverrides,
  Route as Route_
} from '@gnothi/schemas/api'

type RecordResult = APIGatewayProxyResultV2 | null

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
> = (req: z.TypeOf<I>, context: FnContext) => Promise<Array<z.TypeOf<O>>>

export class Route<I extends z.ZodTypeAny, O extends z.ZodTypeAny> {
  i: DefI<I>
  o: DefO<O>
  fn: Fn<I, O>
  constructor(defs: Route_<I, O>, fn: Fn<I, O>) {
    const {i, o} = defs
    this.i = {
      ...i,
      t: i.t || {ws: true}
    }
    this.o = {
      ...o,
      t: o.t || {ws: true},
      keyby: o.keyby || 'id',
    }
    this.fn = z.function()
      .args(i.s, z.any())
      .returns(o.s.array().promise())
      .implement(fn)
  }
}
