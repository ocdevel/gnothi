import {driver, rdsClient} from "../db";
import {readFileSync} from "fs";

const showTables = `
SELECT *
FROM pg_catalog.pg_tables
WHERE schemaname != 'pg_catalog' AND 
    schemaname != 'information_schema';
`

export async function initDb() {
  const sql = readFileSync('data/init/init.sql', {encoding: 'utf-8'})
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
