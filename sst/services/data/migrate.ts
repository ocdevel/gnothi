import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import {readFileSync, existsSync, readdirSync} from "fs";
import {sql} from "drizzle-orm/sql";
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import {sharedStage, DB} from "./db";

export async function main(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
  DB.prepLambda(context)

  const dbPostgres = new DB('postgres')
  await dbPostgres.init()

  // TODO add `wipe` arg
  // await dbPostgres.query(sql`drop database if exists ${sharedStage}`)

  //const exists = await dbPostgres.query(sql`SELECT datname FROM pg_database WHERE datistemplate = false;`)
  const exists = await dbPostgres.query(sql`SELECT datname FROM pg_database WHERE datname = ${sharedStage}`)
  if (exists.length === 0) {
    console.log("db didn't exist, creating")
    await dbPostgres.pg.query(`create database ${sharedStage}`)
  }

  const dbTarget = new DB(sharedStage)
  await dbTarget.init()

  // kill all connections to dbTarget
  // await dbPostgres.query(`select pg_terminate_backend(pg_stat_activity.pid) from pg_stat_activity where pg_stat_activity.datname = '${dbTargetName}';`, [])
  let migrationsFolder: string

  // console.log(readdirSync(".")) //  helper to find path. TODO figure out proper
  // relative path code
  const tryThese = ["data/migrations", "services/data/migrations"]
  if (existsSync(tryThese[0])) { migrationsFolder = tryThese[0] }
  else { migrationsFolder = tryThese[1] }

  console.log("migrating", sharedStage, migrationsFolder)

  await migrate(dbTarget.drizzle, {migrationsFolder})

  // create database if it doesn't exist
  const versions = await dbTarget.queryFirst(sql`select value from keyvalues where key='version'`)

  console.log('responding')
  const message = `DB Response: ${JSON.stringify(versions)}`
  console.log({message})
  return {
    body: JSON.stringify({message}),
    statusCode: 200,
    isBase64Encoded: false,
    headers: {
      'Content-Type': 'application/json',
    },
  }
}
