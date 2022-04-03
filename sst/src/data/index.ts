import {
  RDSData,
  ExecuteStatementCommandOutput,
  ResultSetOptions,
  SqlParameter
} from "@aws-sdk/client-rds-data";
import {ExecuteStatementRequestPartial} from './patchAws'
import {envKeys} from "../util/env";
import {readFileSync} from "fs";

export const rds: RDSData = new RDSData({ region: process.env.AWS_REGION });

export interface Overrides {
    resourceArn?: string
    secretArn?: string
    sql?: string
    database?: string
    schema?: string
    parameters?: SqlParameter[]
    transactionId?: string
    includeResultMetadata?: boolean
    continueAfterTimeout?: boolean
    resultSetOptions?: ResultSetOptions
}

export class DB {
  #defaults = {
    secretArn: process.env[envKeys.db.secret],
    resourceArn: process.env[envKeys.db.cluster],
    database: process.env[envKeys.db.database], // 'information_schema'
    // sql: 'SHOW TABLES',
    includeResultMetadata: true,
  }
  #overrides: Overrides = {};
  constructor(overrides: any = null) {
    if (overrides) {
      this.#overrides = overrides
    }
  }

  async execute(params: ExecuteStatementRequestPartial): Promise<any[]> {
    const response = await rds.executeStatement({
      ...this.#defaults,
      ...this.#overrides,
      ...params
    })
    return this.#transformResponse(response)
  }

  #transformResponse(response: ExecuteStatementCommandOutput): any[] {
    if (response.records === undefined) {return []}
    if (response.columnMetadata === undefined) {return []}
    return response.records.map((fields) => {
      return Object.fromEntries(fields.map((field, i) => [
        response.columnMetadata![i].name,
        Object.values(field)[0]
      ]))
    })
  }

  async init(dbName: string) {
    const sql = readFileSync('src/data/init.sql', {encoding: 'utf-8'})
    this.#overrides.database = dbName
    await this.execute({
      sql: `DROP DATABASE IF EXISTS ${dbName};CREATE DATABASE ${dbName}`,
      database: undefined,
    })
    await this.execute({sql})
  }
}



