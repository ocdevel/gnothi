import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'
import {APIGatewayEvent, APIGatewayProxyResult, Context} from 'aws-lambda'
import { Client as PgClient, Pool, QueryResult } from 'pg'
import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres'
import { sql, SQL } from 'drizzle-orm/sql'

import {z} from 'zod'
import * as S from '@gnothi/schemas'
// @ts-ignore
import dayjs from 'dayjs'
import {readFileSync} from "fs";

const dbSchema = {
  users: S.Users.User,
  ws_connections: S.Ws.WsConnection,
  tags: S.Tags.Tag,
  entries: S.Entries.Entry,
  entries_tags: S.Tags.EntryTag,
  fields: S.Fields.Field,
  field_entries: S.Fields.FieldEntry,
  groups: S.Groups.Group,
  shares: S.Shares.Share,
  shares_tags: S.Shares.ShareTag,
  shares_users: S.Shares.ShareUser,
  notifs: S.Notifs.Notif,
}

export class DB {
  // private variable which will be singleton-initialized for running lambda (for all
  // future invocations). Note use of this class exported as an instance (bottom of file),
  // not instantiated by callers
  private client_: NodePgDatabase | undefined
  private dbName: string

  constructor(dbName: string) {
    if (!dbName) {
      throw new Error('dbName is required. Would use postgres as default, but that could cause issues')
    }
    this.dbName = dbName // || 'postgres'
  }

  static prepLambda(context: Context) {
    // https://gist.github.com/streamich/6175853840fb5209388405910c6cc04b
    context.callbackWaitsForEmptyEventLoop = false; // !important to reuse pool
  }

  static stagename() {
    return `gnothi${process.env.stage}`
  }

  async createClient(): Promise<NodePgDatabase> {
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
    // const db = new PgClient({
    const client = new Pool({
      max: 1, min: 0, // single connection for singleton Lambda
      host: secretValues.host, // host is the endpoint of the db cluster
      port: secretValues.port, // port is 5432
      user: secretValues.username, // username is the same as the secret name
      password: secretValues.password, // this is the password for the default database in the db cluster
      database: this.dbName,
    })
    // await client.connect()
    const db = drizzle(client)

    // See https://gist.github.com/streamich/6175853840fb5209388405910c6cc04b
    // If using Pool (not Client), we can forgo connect() and the pool will self-manage.
    // Otherwise, we'd need:
    // const client = await pool.connect()
    // try {await client.query(q)}
    // finally {client.release(true)}

    return db
  }

  async client(): Promise<NodePgDatabase> {
    if (!this.client_) {
      this.client_ = await this.createClient()
    }
    return this.client_
  }

  _removeNull(obj: object) {
    // Returned zod objects with optional fields only allow `null` if `.nullable()`
    // is used. This strips nulls from the object. Keep an eye on this, there may
    // be a future situation in which null is a meaningful value over undefined.
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== null));
  }

  _removeUndefined(obj: object) {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
  }

  async query<O = any>(sql_: SQL): Promise<O[]> {
    try {
      const client = await this.client()
      const queryResult: QueryResult<O> = await client.execute<O>(sql_)
      return queryResult.rows.map(this._removeNull)
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
    const clean = this._removeUndefined(obj)
    const keys = Object.keys(clean)
    const values = keys.map(k => clean[k])
    const sql = `insert into ${table} (${keys.join(', ')}) values (${keys.map((_, i) => `$${i+1}`).join(', ')}) returning *`
    return this.queryFirst<O>(sql, values)
  }
}

export const db = new DB(DB.stagename())
