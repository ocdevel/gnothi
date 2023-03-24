import {DB} from './db'

const db_ = new DB()
// @ts-ignore - initialize top-level
await db_.init()
export const db = db_
