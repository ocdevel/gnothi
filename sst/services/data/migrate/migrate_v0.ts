import {DB} from "../db";
import {users as user_v0, entries as entries_v0} from "./first/schema";
import {users} from '../schemas/users'
import {entries, Entry} from '../schemas/entries'
import {notes, Note} from '../schemas/notes'
import {fields, Field} from '../schemas/fields'
import {people, Person} from '../schemas/people'
import {tags, Tag} from '../schemas/tags'
import {eq, and, or, sql} from "drizzle-orm";
import { Config } from "@serverless-stack/node/config"
import {URL} from 'url'


import { Fernet } from 'fernet-nodejs';
import {exec} from "child_process";
import {readFileSync} from "fs";

let decrypt = (token: string): string => {
  throw new Error("FLASK_KEY not imported correctly for migrate_v0 decryption")
  return token
}
if (Config.FLASK_KEY_V0) {
  // const flaskKey = awsSecrets.getItem("v0_flask_key")
  const fernetKey = Fernet.deriveKey(Config.FLASK_KEY_V0)
  const f = new Fernet(fernetKey)
  decrypt = (token: string) => f.decrypt(token)
}

export async function import_v0(db: DB) {
  const dbUrl = Config.DB_URL_V0
  if (!dbUrl) { throw new Error("DB_URL_V0 not imported correctly for migrate_v0") }
  const dbv0 = new URL(dbUrl);
  // no rhyme to me using sometimes spaces, sometimes join(); just need something I can see easily
  const cmd = [
    `PGPASSWORD='${dbv0.password}`,
    "pg_dump --data-only --exclude-table=cache_users --exclude-table=cache_entries",
    `-U ${dbv0.username}`,
    `-h ${dbv0.hostname}`,
    `-d ${dbv0.pathname.slice(1)}`,
    "> /tmp/data_v0.sql"
  ].join(' ')

  // Execute CLI command to dump postgres database from old server to /tmp/data_v0.sql
  await exec(cmd)
  // Read that file to a string
  const oldSql = readFileSync("/tmp/data_v0sql", "utf8")
  await db.pg.query(`${oldSql}`)
  await addUsersToCognito(db)
}

// Note: when working with old DB, only pull columns needed (don't `select *`) since we'll be streaming all the data
// and need the RAM wiggle-room

export async function addUsersToCognito(db: DB) {
  const users_ = await db.drizzle.select({
    id: users.id,
    email: users.email,
  }).from(users)
  // FIXME this is pseudocode
  await Promise.all(users_.map(async (u) => cognito.addUser({email: u.email, id: u.id})))
}

export async function decryptColumns(db: DB) {
  // Have as separate functions so we can reclaim the RAM in between without getting funky with TypeScript
  await decryptUsers(db)
  await decryptEntries(db)
  await decryptNotes(db)
  await decryptFields(db)
  await decryptTags(db)
  await decryptPeople(db)
}

function decryptRow(row: object & {id: string}) {
  // NOTE this will only work if rows are keyed by id (not double-primarykey, no id, etc).
  const {id, ...rest} = row
  // decrypt every value in this object
  const decrypted = Object.entries(rest).map(([k, v]) => [k, decrypt(v)])
  return {...decrypted, id}
}

export async function decryptUsers(db: DB) {
  const rows = await db.drizzle.select({
    id: users.id,
    first_name: users.first_name,
    last_name: users.last_name,
    gender: users.gender,
    orientation: users.orientation,
    bio: users.bio,
    habitica_user_id: users.habitica_user_id,
    habitica_api_token: users.habitica_api_token
  }).from(users)
  await batchUpdate(db, "users", rows.map(decryptRow))
}

export async function decryptEntries(db: DB) {
  const rows = await db.drizzle.select({
    id: entries.id,
    title: entries.title,
    text: entries.text,
  }).from(entries)
  await batchUpdate(db, "entries", rows.map(decryptRow))
}

export async function decryptNotes(db: DB) {
  const rows = await db.drizzle.select({
    id: notes.id,
    text: notes.text,
  }).from(notes)
  await batchUpdate(db, "notes", rows.map(decryptRow))
}

// FIXME fields2?

export async function decryptFields(db: DB) {
  const rows = await db.drizzle.select({
    id: fields.id,
    name: fields.name,
  }).from(fields)
  await batchUpdate(db, "fields", rows.map(decryptRow))
}

export async function decryptPeople(db: DB) {
  const rows = await db.drizzle.select({
    id: people.id,
    name: people.name,
    relation: people.relation,
    issues: people.issues,
    bio: people.bio,
  }).from(people)
  await batchUpdate(db, "people", rows.map(decryptRow))
}

export async function decryptTags(db: DB) {
  const rows = await db.drizzle.select({
    id: tags.id,
    name: tags.name,
  }).from(tags)
  await batchUpdate(db, "tags", rows.map(decryptRow))
}


// Can probably clean this up, came from ChatGPT
async function batchUpdate(db: DB, tableName: string, updates: any[]) {
  // Ensure updates are provided
  if (!updates || updates.length === 0) {
    throw new Error('No updates provided');
  }

  // Get column names from the first update object
  const columnNames = Object.keys(updates[0]);

  // Ensure each update has the same structure
  updates.forEach(update => {
    const updateColumns = Object.keys(update);
    if (updateColumns.length !== columnNames.length || !updateColumns.every((col, index) => col === columnNames[index])) {
      throw new Error('Inconsistent update structure');
    }
  });

  // Build the VALUES clause
  const valuesClause = updates.map(update =>
    `(${columnNames.map(col => `'${update[col]}'`).join(', ')})`
  ).join(', ');

  // Build the SET clause
  const setClause = columnNames.map(col =>
    sql`${col} = new_values.${col}`
  ).join(', ');

  // Build and execute the UPDATE query
  const query = sql`
    UPDATE ${tableName}
    SET ${setClause}
    FROM (VALUES ${valuesClause}) AS new_values (${columnNames.join(', ')})
    WHERE ${tableName}.id = new_values.id;
  `;

  return db.drizzle.execute(query);
}
