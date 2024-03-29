import { describe, it, expect } from "vitest";
import {db} from '../data/dbSingleton'
import {handler as postConfirmation} from '../auth/postConfirmation'
import {v4 as uuid} from 'uuid'
import {main, proxy} from '../main'
import {Req, Res} from '@gnothi/schemas/api'
import * as S from '@gnothi/schemas'
import {entries_upsert_response, entries_list_response} from '@gnothi/schemas/entries'

import {readFileSync} from "fs";
import {ulid} from "ulid";
// @ts-ignore
import _ from 'lodash'

const mockEntriesFile = readFileSync("services/tests/mock_entries.json", {encoding: "utf-8"})
const mockEntries = JSON.parse(mockEntriesFile).map(e => ({
  // remove unwanted fields like id/user_id/created_at
  title: e.title,
  text: e.text,
}))

export class Utils {
  uid: string
  mainTag: string
  noAiTag: string
  user: S.Users.User
  auth: {email: string, pass: string, cognito_id: string}
  eids: string[]

  constructor() {
    this.eids = []
  }

  async signup() {
    const auth = {email: `${ulid()}@x.com`, pass: "MyPassword!1", cognito_id: uuid()}
    this.auth = auth
    const cognitoEvent = {
      request: {userAttributes: {email: auth.email}},
      userName: auth.cognito_id
    }
    const res = await postConfirmation(cognitoEvent, {}, _.noop)
    this.user = await db.queryFirst<S.Users.User>(
      "select * from users where cognito_id=$1",
      [auth.cognito_id]
    )
    this.uid = this.user.id
    this.mainTag = (await db.queryFirst<S.Tags.Tag>(
      "select * from tags where user_id=$1",
      [this.uid]
    )).id
    this.noAiTag = (await db.queryFirst<S.Tags.Tag>(
      "insert into tags (name, ai_summarize, user_id) values ('NoAI', false, $1) returning *;",
      [this.uid]
    )).id
  }

  async request<T = any>(req: Req): Promise<Res<T>> {
    const event = {
      requestContext: {
        authorizer: {jwt: {claims: {sub: this.auth.cognito_id}}},
        http: {method: "POST", path: "/"}
      },
      body: req
    }
    const context = {}
    // @ts-ignore
    const res = await proxy(event, context, _.noop)
    // @ts-ignore
    return JSON.parse(res.body) as Res<T>
  }

  async _addEntry(title, text, noai=false): Promise<entries_upsert_response> {
    const res = await this.request<entries_upsert_response>({
      event: "entries_upsert_request",
      data: {
        entry: {title, text},
        tags: noai ? {[this.noAiTag]: true} : {[this.mainTag]: true}
      }
    })
    // console.log({entryRes: JSON.stringify(res)})
    const entry = res.data[0] as entries_upsert_response
    this.eids.push(entry.id)
    return entry
  }

  async addEntries({n_summarize=0, n_index=0}: {n_summarize: number, n_index: number}) {
    let buffer = mockEntries.slice()
    n_summarize = n_summarize === -1 ? mockEntries.length : n_summarize
    for (let i = 0; i < n_summarize; i++) {
      const entry = buffer[0]
      buffer = buffer.slice(1)
      await this._addEntry(entry.title, entry.text)
    }

    // then index the rest
    // take only what's left, based on their n_index
    let remaining = mockEntries.length - this.eids.length
    if (n_index === -1 || n_index > remaining) {
      n_index = remaining
    } // else n_index stays as-is
    for (let i = 0; i < n_index; i++) {
      const entry = buffer[0]
      buffer = buffer.slice(1)
      await this._addEntry(entry.title, entry.text, true)
    }
  }

  async listEntries() {
   const res = await this.request<entries_list_response>({
      event: "entries_list_request",
      data: {}
    })
    console.log({resListEntries: res})
    return res
  }

  async wait(seconds: number) {
    return new Promise((resolve, reject) => setTimeout(() => {
      resolve(null)
    }, seconds * 1000))
  }
}
