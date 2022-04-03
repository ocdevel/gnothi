import { connect, disconnect } from './ws'
import { DB } from '../data/index'
import {randomUUID} from "crypto";

test("ws connect", async () => {
  const db = new DB({database: 'wsconnect'})
  await connect(db, 'abc', randomUUID().toString())
  let results = await db.execute({
    sql: "select count(*) as ct from ws_connections",
  })
  const ct = results[0].ct
  await disconnect(db, 'abc')
  results = await db.execute({
    sql: "select count(*) as ct from ws_connections",
  })
  expect(ct - results[0].ct).toBe(1)
});
