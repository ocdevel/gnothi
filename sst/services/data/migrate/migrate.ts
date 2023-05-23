import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import {readFileSync, existsSync, readdirSync} from "fs";
import {sql, SQL} from "drizzle-orm";
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import {sharedStage, DB} from "../db"
import {users} from '../schemas/users'
import { exec } from 'child_process';
import { Config } from "sst/node/config"
import {Bucket} from "sst/node/bucket";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";


// TODO copy/pasted from v0/migrate.spec.ts; refactor to shared file
function killConnections(dbname: string) {
  return `SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname='${dbname}'
      AND pid <> pg_backend_pid();`
  // await dbPostgres.query(`select pg_terminate_backend(pg_stat_activity.pid) from pg_stat_activity where pg_stat_activity.datname = '${dbTargetName}';`, [])
}


type MigrateEvent = {
  wipe?: boolean
  first?: boolean
  rest?: boolean
}

export async function main(event: MigrateEvent, context: Context): Promise<APIGatewayProxyResult> {
  DB.prepLambda(context)

  console.log({event})

  // console.log(readdirSync(".")) //  helper to find path. TODO figure out proper relative path code
  let migrationsRoot: string
  const tryThese = ["data/migrate", "services/data/migrate"]
  if (existsSync(tryThese[0])) { migrationsRoot = tryThese[0] }
  else { migrationsRoot = tryThese[1] }
  const migrationsFirst = `${migrationsRoot}/first`
  const migrationsRest = `${migrationsRoot}/rest`

  const dbPostgres = new DB({database: 'postgres'})
  await dbPostgres.connect()

  if (event?.wipe) {
    await dbPostgres.pg.query(killConnections(sharedStage))
    await dbPostgres.pg.query(`drop database if exists ${sharedStage}`)
    await dbPostgres.pg.query(`create database ${sharedStage}`)
    await wipeCognito()
  }

  // git-blame for auto-check if db exists, create if not

  const dbTarget = new DB({database: sharedStage})
  await dbTarget.connect()

  console.log("migrating", sharedStage, migrationsRoot)

  // git-blame for v0 migration

  if (event?.first) {
    // Having it manually specified since the v0 -> v1 migration will run this first, then import data,
    // then run the rest
    await migrate(dbTarget.drizzle, {migrationsFolder: migrationsFirst})
  }
  if (event.rest) {
    // then do the rest of the (modern / current) migrations; post v0. Note, v0 db schema was generated as a migration
    // for drizzle, then the folder was copy/pasted into the rest/ folder on which to build. This because I can't
    // tell drizzle in code-form (here) to migrate step1, then do stuff, then migrate 1-on.
    await migrate(dbTarget.drizzle, {migrationsFolder: migrationsRest})
  }

  // TODO something smarter, like drizzle table version number
  const sanityCheck = (await dbTarget.drizzle.execute(sql`select 1`))[0]

  console.log('responding')
  const message = `DB Response: ${JSON.stringify(sanityCheck)}`
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

export async function wipeCognito() {
  // FIXME
}
