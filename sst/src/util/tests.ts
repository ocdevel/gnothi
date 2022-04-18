import {MyProxyEvent} from "../routes/aws"
import {DB} from '../data/db'
import {Context} from "../routes/types"
import * as s from "../data/schemas";
import _get from "lodash/get";
import _set from "lodash/set";
import {z} from 'zod'

type InnerFn = (context: Context) => Promise<unknown>
type ProvidesCallback = () => Promise<unknown>
export const withDB = (name: string, fixturePaths: string[], fn: InnerFn): ProvidesCallback  => {
  return async () => {
    const database = (name + (+new Date).toString()).replace(/[\W]/g, '')
    const db = new DB({database})
    await db.init()
    const f = await initFixtures(db, fixturePaths)
    const context: Context = {db, user: null}
    if (f?.users?.me) {
      context.user = f.users.me
    }
    await fn(context)
    await db.drop()
  }
}

export const fixtures = {
  users: {
    me: {
      email: 'me@x.com',
      cognito_id: 'me',
      username: 'me',
    },
    friend: {
      email: 'friend@x.com',
      cognito_id: 'friend',
      username: 'friend',
    },
    stranger: {
      email: 'stranger@x.com',
      cognito_id: 'stranger',
      username: 'stranger',
    }
  }
}

const schemas = {
  users: {input: s.User.partial(), output: s.User},
}

export const initFixtures = async (db: DB, paths: string[]): Promise<Record<string, any>> => {
  const hydrated = {}
  await Promise.all(paths.map(async path => {
    const table = path.split(".")[0]
    const result = await db.insert(
      table,
      _get(fixtures, path),
    )
    _set(hydrated, path, schemas[table].output.parse(result[0]))
  }))
  return hydrated
}

