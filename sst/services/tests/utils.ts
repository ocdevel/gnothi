import { describe, it, expect } from "vitest";
import {db} from '../data/db'
import {handler as postConfirmation} from '../auth/postConfirmation'
import {v4 as uuid} from 'uuid'
import {main, proxy} from '../main'
import {Req, Res} from '@gnothi/schemas/api'
import * as S from '@gnothi/schemas'

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
  entries: any[]

  constructor() {
    this.entries = []
  }

  async signup() {
    const auth = {email: `${ulid()}@x.com`, pass: "MyPassword!1", cognito_id: uuid()}
    this.auth = auth
    const cognitoEvent = {
      request: {userAttributes: {email: auth.email}},
      userName: auth.cognito_id
    }
    const res = await postConfirmation(cognitoEvent, {}, _.noop)
    this.user = (await db.executeStatement<S.Users.User>({
      sql: "select * from users where cognito_id=:cognito_id",
      parameters: [{name: "cognito_id", value: {stringValue: auth.cognito_id}}]
    }))[0]
    this.uid = this.user.id
    this.mainTag = (await db.executeStatement<S.Tags.Tag>({
      sql: "select * from tags where user_id=:user_id",
      parameters: [{name: "user_id", value: {stringValue: this.uid}, typeHint: "UUID"}]
    }))[0].id
    this.noAiTag = (await db.executeStatement<S.Tags.Tag>({
      sql: "insert into tags (name, ai_summarize, user_id) values ('NoAI', false, :user_id) returning *;",
      parameters: [{name: "user_id", value: {stringValue: this.uid}, typeHint: "UUID"}]
    }))[0].id
  }

  async request(req: Req): Promise<Res> {
    const event = {
      requestContext: {
        authorizer: {jwt: {claims: {sub: this.auth.cognito_id}}},
        http: {method: "POST", path: "/"}
      },
      body: req
    }
    const context = {}
    // @ts-ignore
    return await proxy(event, context, _.noop)
  }

  async _addEntry(title, text, noai=false) {
    await this.request({
      event: "entries_upsert_request",
      data: {
        entry: {title, text},
        tags: noai ? {[this.noAiTag]: true} : {[this.mainTag]: true}
      }
    })
  }

  async addEntries({n_summarize=0, n_index=0}: {n_summarize: number, n_index: number}) {
    let buffer = mockEntries.slice()
    n_summarize = n_summarize === -1 ? mockEntries.length : n_summarize
    for (let i = 0; i < n_summarize; i++) {
      const entry = buffer[0]
      buffer = buffer.slice(1)
      this.entries.push(entry)
      await this._addEntry(entry.title, entry.text)
    }

    // then index the rest
    // take only what's left, based on their n_index
    let remaining = mockEntries.length - this.entries.length
    if (n_index === -1 || n_index > remaining) {
      n_index = remaining
    } // else n_index stays as-is
    for (let i = 0; i < n_index; i++) {
      const entry = buffer[0]
      buffer = buffer.slice(1)
      this.entries.push(entry)
      await this._addEntry(entry.title, entry.text, true)
    }
  }

  async wait(seconds: number) {
    return new Promise((resolve, reject) => setTimeout(() => {
      resolve(null)
    }, seconds * 1000))
  }
}
