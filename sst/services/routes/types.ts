import type {APIGatewayProxyResultV2} from 'aws-lambda'
import {z} from "zod";

import {Entry, entries} from '../data/schemas/entries'
import {EntryTag, entriesTags} from '../data/schemas/entriesTags'
import {FieldEntry, fieldEntries} from '../data/schemas/fieldEntries'
import {Field, fields} from '../data/schemas/fields'
import {Person, people} from '../data/schemas/people'
import {Share, shares, sharesTags, ShareTag, sharesUsers, ShareUser} from '../data/schemas/shares'
import {Tag, tags} from '../data/schemas/tags'
import {User, users} from '../data/schemas/users'
import {WsConnection, wsConnections} from '../data/schemas/wsConnections'

import {Users} from '../data/models/users'
import {Entries} from '../data/models/entries'
import {Fields} from '../data/models/fields'
import {Insights} from '../data/models/insights'
import {Shares} from '../data/models/shares'
import {Notes} from '../data/models/notes'

import {Events} from '@gnothi/schemas/events'
import {DB} from '../data/db'
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

type Viewer = { user: User, share?: Share }
type HandleRes = <T extends z.ZodTypeAny = any>(def: DefO<T>, res: Partial<Res<T>>, fnContext: FnContext) => Promise<RecordResult>
type HandleReq = (req: Req, fnContext: FnContext) => Promise<RecordResult>
type ContextArgs = {
  db: DB
  user: User
  vid?: string

  everyone?: false

  requestId?: string
  finalRes?: unknown
  connectionId?: string

  handleRes: HandleRes
  handleReq: HandleReq
}
export class FnContext {
  everyone?: false

  requestId?: string
  finalRes?: unknown
  connectionId?: string
  handleRes: HandleRes
  handleReq: HandleReq

  // Pass the DB connection through the pipeline. This allows initiating connection once, closing
  // at the end
  db: DB

  // Even though schemas can be imported directly in other files, having them handy where
  // they're most commonly used (in conjunction with snooping-checks, model methods, etc) is
  // a convenience
  s = {
    entries,
    entriesTags,
    fieldEntries,
    fields,
    people,
    shares,
    sharesTags,
    sharesUsers,
    tags,
    users,
    wsConnections,
  }

  // Instantiate models as properties to the FnContext. This allows the models context-access
  // to things like user, viewer, snooping, etc - without having ot pass those properties into
  // every model method
  m: {
    users: Users
    entries: Entries
    fields: Fields
    insights: Insights
    shares: Shares
    notes: Notes
  }

  user: User
  viewer: Viewer
  uid: string
  vid: string
  snooping: boolean

  constructor({db, user, vid, everyone, requestId, finalRes, connectionId, handleRes, handleReq}: ContextArgs) {
    this.db = db
    this.uid = user.id
    this.user = user
    this.vid = vid || user.id

    this.everyone = everyone
    this.requestId = requestId
    this.finalRes = finalRes
    this.connectionId = connectionId
    this.handleRes = handleRes
    this.handleReq = handleReq

    this.m = {
      users: new Users(this),
      entries: new Entries(this),
      fields: new Fields(this),
      insights: new Insights(this),
      shares: new Shares(this),
      notes: new Notes(this)
    }
  }

  async init() {
    const {viewer, snooping} = await this.m.users.snoop()
    this.snooping = snooping
    this.viewer = viewer
  }

  clone() {
    // TODO clone properties necessary to propagate, but not those which should be different
  }
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

export class Route<I extends z.ZodTypeAny, O extends z.ZodTypeAny, EI extends Events, EO extends Events> {
  i: DefI<I, EI>
  o: DefO<O, EO>
  fn: Fn<I, O>
  constructor(defs: Route_<I, O, EI, EO>, fn: Fn<I, O>) {
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
