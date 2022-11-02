import z from "zod";
import {Events} from "./events";
import {Def} from "./utils";
import * as Users from "./users";
import * as Tags from "./tags";
import * as Entries from "./entries";
import * as Fields from "./fields";
import * as Groups from "./groups";

export type Trigger = {
  ws?: boolean
  http?: boolean
  s3?: boolean
  rds?: boolean
  steps?: Events[]
}

export type Req<T = unknown> = {
  event: Events,
  data: T
}

export type ResError = {
  event: Events
  error: true
  code: number
  data: string
}
export type ResSuccess<T = unknown> = {
  event: Events
  error: false
  code: number
  data: T[]

  keyby?: string
  op?: "update" | "prepend" | "append" | "delete"
  event_as?: Events
}
export type Res<T = unknown> = ResSuccess<T> | ResError

export const routes = {
  ...Users.routes,
  ...Tags.routes,
  ...Entries.routes,
  ...Fields.routes,
  ...Groups.routes,
}

export const mocks = {
  users: Users.fakeData,
  tags: Tags.fakeData,
  entries: Entries.fakeData
}

const routes_: {[k in Events]?: Def} = routes

export type ResUnwrap<T> = {
  res: Res<T[]>
  rows: T[]
  first: T
  hash: {[k: string]: T}
  ids: string[]
}
