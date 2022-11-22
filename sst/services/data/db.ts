import RDSDataService from "aws-sdk/clients/rdsdataservice";
import { RDS } from "@serverless-stack/node/rds";
import { Kysely, Selectable } from "kysely";
import { DataApiDialect } from "./kysely-data-api/src";
// import type { Database } from "./sql.generated";

import * as S from '@gnothi/schemas'
import {SqlParameter} from "@aws-sdk/client-rds-data";

interface Database {
  users: S.Users.User
  ws_connections: S.Ws.WsConnection
  tags: S.Tags.Tag
  entries: S.Entries.Entry
  entries_tags: S.Tags.EntryTag
  fields: S.Fields.Field
  field_entries: S.Fields.FieldEntry
  groups: S.Groups.Group
  shares: S.Shares.Share
  shares_tags: S.Shares.ShareTag
  shares_users: S.Shares.ShareUser
  notifs: S.Notifs.Notif
}

const client = new RDSDataService()
export const driver = {
  secretArn: RDS.db.secretArn,
  resourceArn: RDS.db.clusterArn,
  database: RDS.db.defaultDatabaseName,
  client,
}

export const DB = new Kysely<Database>({
  dialect: new DataApiDialect({
    mode: "postgres",
    driver
  }),
})

export async function raw(sql: string, parameters: SqlParameter[], batch=false) {
  const res = await client.executeStatement({
    sql,
    parameters,
    includeResultMetadata: true,
    secretArn: driver.secretArn,
    resourceArn: driver.resourceArn,
    database: driver.database,
  }).promise()
  if (!res.records) {return []}
  if (!res.columnMetadata) {return []}
  const rows = res.records.map((fields) =>
    Object.fromEntries(fields.map((field, i) => {
      const key: string = res.columnMetadata![i].name
      const [hint, val] = Object.entries(field)[0]
      const value = hint === 'isNull' ? undefined
          : val // any other edge-cases?
      return [key, value]
    }))
  )
  return rows
}

export type Row = {
  [Key in keyof Database]: Selectable<Database[Key]>;
};

export * as SQL from "./db";
