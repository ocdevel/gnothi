import {driver} from "../db";
import {readFileSync} from "fs";

const {client, resourceArn, secretArn, database} = driver

const showTables = `
SELECT *
FROM pg_catalog.pg_tables
WHERE schemaname != 'pg_catalog' AND 
    schemaname != 'information_schema';

export async function initDb() {
  
}`

export async function initDb() {
  const sql = readFileSync('services/data/init/init.sql', {encoding: 'utf-8'})
  const opts = {secretArn, resourceArn}

  // disconnect other clients from gnothidev so we can drop/re-create it
  await client
    .executeStatement({
      ...opts,
      database: "postgres",

      sql: `SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE pid <> pg_backend_pid() AND datname = '${database}'`,
    })
    .promise();

  await client.executeStatement({
    ...opts,
    database: "postgres",

    sql: `drop database if exists ${database};
    create database ${database};`,
  }).promise()

  // import the sql file
  await client.executeStatement({
    ...opts, database, sql
  }).promise()

  const res = await client.executeStatement({
    ...opts,
    database,
    sql: `insert into users (email) values ('tylerrenelle@gmail.com');`,
  }).promise()
  console.log(res)
}
