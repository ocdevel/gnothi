import {driver, rdsClient} from "./data/db";
import {readFileSync} from "fs";
import {dirname, resolve} from 'path';
import { fileURLToPath } from 'url';

// stacks/Api.ts - bundle: { copyFiles: [{from: "data/init/init.sql"}] }
// should put in the same place as other files. I think maybe I need to copy it to {to: "services/data/init/init.sql"}?
// For now I'll just use absolute path. Need to replace this with kysley migration anyway
// const sqlFile = new URL('data/init/init.sql', import.meta.url);
const sqlFile = '/var/task/data/init/init.sql'

const showTables = `
SELECT *
FROM pg_catalog.pg_tables
WHERE schemaname != 'pg_catalog' AND 
    schemaname != 'information_schema';
`

export async function initDb() {
  const sql = readFileSync(sqlFile, {encoding: "utf-8"})
  const opts = {secretArn: driver.secretArn, resourceArn: driver.resourceArn}
  const {database} = driver

  // disconnect other clients from gnothidev so we can drop/re-create it
  await rdsClient
    .executeStatement({
      ...opts,
      database: "postgres",

      sql: `SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE pid <> pg_backend_pid() AND datname = '${database}'`,
    })
    // .promise();

  await rdsClient.executeStatement({
    ...opts,
    database: "postgres",

    sql: `drop database if exists ${database};
    create database ${database};`,
  })
    // .promise()

  // import the sql file
  await rdsClient.executeStatement({
    ...opts, database, sql
  })
    // .promise()
}

export async function main() {
  await initDb()
  return {statusCode: 200}
}
