import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import {readFileSync, existsSync, readdirSync} from "fs";
import {DB} from "../db";


export async function main(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
  DB.prepLambda(context)

  // TODO add `wipe` arg
  const dbPostgres = new DB('postgres')
  const dbTargetName = DB.stagename()
  let dbTarget: DB
  try {
    dbTarget = new DB(dbTargetName)
    await dbTarget.query("select 1", [])
  } catch (err) {
    console.error(err)
    console.log("db didn't exist, creating")
    // kill all connections to dbTarget
    // await dbPostgres.query(`select pg_terminate_backend(pg_stat_activity.pid) from pg_stat_activity where pg_stat_activity.datname = '${dbTargetName}';`, [])
    let initFile: string

    // console.log(readdirSync(".")) //  helper to find path. TODO figure out proper
    // relative path code
    const tryThese = ["data/init/init.sql", "services/data/init/init.sql"]
    if (existsSync(tryThese[0])) { initFile = tryThese[0] }
    else { initFile = tryThese[1] }

    const sql = readFileSync(initFile, {encoding: 'utf-8'})
    console.log("running init.sql")
    await dbPostgres.query(`drop database if exists ${dbTargetName};`, [])
    await dbPostgres.query(`create database ${dbTargetName};`, [])
    dbTarget = new DB(dbTargetName)
    await dbTarget.query(sql, [])
  }

  // create database if it doesn't exist
  const versions = await dbTarget.query("select value from keyvalues where key='version'", [])
  // TODO run migrations based on version
  
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
