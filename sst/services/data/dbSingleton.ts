import {DB} from './db'

const db_ = new DB({})
// @ts-ignore - initialize top-level
await db_.connect()
export const db = db_
