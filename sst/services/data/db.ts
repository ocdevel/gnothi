import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'
import {APIGatewayEvent, APIGatewayProxyResult, Context} from 'aws-lambda'
import { Client as PgClient, Pool, QueryResult } from 'pg'
import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres'
import { sql, SQL } from 'drizzle-orm/sql'

export const sharedStage = `gnothi${process.env.sharedStage}`

type ConnectionArgs = {
  host: string
  port: number
  username: string
  password: string
}

export class DB {
  // private variable which will be singleton-initialized for running lambda (for all
  // future invocations). Note use of this class exported as an instance (bottom of file),
  // not instantiated by callers
  private inited = false
  public pg: Pool
  public drizzle: NodePgDatabase
  public dbName: string

  constructor(dbName?: string) {
    this.dbName = dbName || sharedStage
  }

  async getConnectionArgs(): Promise<ConnectionArgs> {
    // set localhost defaults, override if deployed
    if (process.env.IS_LOCAL) {
      return {
        host: "localhost",
        port: 5432,
        username: "postgres",
        password: "password"
      }
    }
    // get the secret from secrets manager.
    const secretsClient = new SecretsManagerClient({})
    const secret = await secretsClient.send(new GetSecretValueCommand({
      SecretId: process.env.rdsSecretArn,
    }))
    const obj = JSON.parse(secret.SecretString ?? '{}')
    return obj as ConnectionArgs
  }

  async init() {
    if (this.inited) { return }
    this.inited = true
    const connectionArgs = await this.getConnectionArgs()
    // const pgClient = new PgClient({
    const pgClient = new Pool({
      max: 1, min: 0, // single connection for singleton Lambda
      host: connectionArgs.host, // host is the endpoint of the db cluster
      port: connectionArgs.port, // port is 5432
      user: connectionArgs.username, // username is the same as the secret name
      password: connectionArgs.password, // this is the password for the default database in the db cluster
      database: this.dbName
    })
    // await pgClient.connect()
    const drizzleClient = drizzle(pgClient)

    // await pgClient.connect()

    // See https://gist.github.com/streamich/6175853840fb5209388405910c6cc04b
    // If using Pool (not Client), we can forgo connect() and the pool will self-manage.
    // Otherwise, we'd need:
    // const client = await pool.connect()
    // try {await client.query(q)}
    // finally {client.release(true)}

    this.drizzle = drizzleClient
    this.pg = pgClient
  }

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
    if (!this.inited) {
      await this.init()
    }
    try {
      const queryResult: QueryResult<O> = await this.drizzle.execute<O>(sql_)
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
