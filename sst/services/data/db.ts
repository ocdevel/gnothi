import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'
import {APIGatewayEvent, APIGatewayProxyResult, Context} from 'aws-lambda'
import { Client as PgClient, Pool, QueryResult } from 'pg'
import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres'
import { sql, SQL } from 'drizzle-orm/sql'

import {readFileSync} from "fs";

const stagename = `gnothi${process.env.stage}`

// set localhost defaults, override if deployed
let secretValues = {
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "password"
}
if (!process.env.IS_LOCAL) {
  // get the secret from secrets manager.
  const secretsClient = new SecretsManagerClient({})
  const secret = await secretsClient.send(new GetSecretValueCommand({
    SecretId: process.env.rdsSecretArn,
  }))
  secretValues = JSON.parse(secret.SecretString ?? '{}')
}

// TODO use env.stage as db name
// TODO initialize DB if not exists
console.log('secreteKeys', Object.keys(secretValues))
// const pgClient = new PgClient({
const pgClient = new Pool({
  max: 1, min: 0, // single connection for singleton Lambda
  host: secretValues.host, // host is the endpoint of the db cluster
  port: secretValues.port, // port is 5432
  user: secretValues.username, // username is the same as the secret name
  password: secretValues.password, // this is the password for the default database in the db cluster
  database: stagename
})
// await pgClient.connect()
const drizzleClient = drizzle(pgClient)

// See https://gist.github.com/streamich/6175853840fb5209388405910c6cc04b
// If using Pool (not Client), we can forgo connect() and the pool will self-manage.
// Otherwise, we'd need:
// const client = await pool.connect()
// try {await client.query(q)}
// finally {client.release(true)}


export class DB {
  // private variable which will be singleton-initialized for running lambda (for all
  // future invocations). Note use of this class exported as an instance (bottom of file),
  // not instantiated by callers
  client = drizzleClient
  private dbName: string

  static prepLambda(context: Context) {
    // https://gist.github.com/streamich/6175853840fb5209388405910c6cc04b
    context.callbackWaitsForEmptyEventLoop = false; // !important to reuse pool
  }

  removeNull(obj: object) {
    // Returned zod objects with optional fields only allow `null` if `.nullable()`
    // is used. This strips nulls from the object. Keep an eye on this, there may
    // be a future situation in which null is a meaningful value over undefined.
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== null));
  }

  removeUndefined(obj: object) {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
  }

  async query<O = any>(sql_: SQL): Promise<O[]> {
    try {
      const queryResult: QueryResult<O> = await drizzleClient.execute<O>(sql_)
      return queryResult.rows.map(this.removeNull)
    } catch (error) {
      // (await this.client()).release(true)
      console.error({error, sql_})
      debugger
      throw error
    // } finally {
    //   console.log({finally: "finally"})
    //   console.log("finally reached")
    //   // this.client_.release()
    }
  }
  async queryFirst<O = any>(sql_: SQL): Promise<O> {
    const rows = await this.query<O>(sql_)
    return rows[0]
  }

  async insert<O = object>(table: string, obj: object): Promise<O> {
    const clean = this.removeUndefined(obj)
    const keys = Object.keys(clean)
    const values = keys.map(k => clean[k])
    const sql = `insert into ${table} (${keys.join(', ')}) values (${keys.map((_, i) => `$${i+1}`).join(', ')}) returning *`
    return this.queryFirst<O>(sql, values)
  }
}

export const db = new DB()
