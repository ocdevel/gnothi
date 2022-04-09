import {
  RDSData,
  ExecuteStatementCommandOutput,
  ResultSetOptions,
  SqlParameter, Field, TypeHint,
} from "@aws-sdk/client-rds-data";
import {envKeys} from "../util/env";
import {readFileSync} from "fs";
import _map from 'lodash/map'
import _reduce from 'lodash/reduce'
import z from 'zod'

export const rds: RDSData = new RDSData({ region: process.env.AWS_REGION });

interface ExecuteRequest {
  database?: string
  sql: string
  values?: {[k: string]: any}
}

type ExecuteResponse = any[]

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
  constructor(overrides: Overrides = {}) {
    this.#overrides = overrides
  }

  async insert(table: string, values: Record<string, any>): Promise<ExecuteResponse> {
    const keys = Object.keys(values)
    const cols = keys.join(', ')
    const placeholders = keys.map(k => ":" + k).join(', ')
    const sql = `insert into ${table} (${cols}) values (${placeholders}) returning *`
    return await this.execute({sql, values})
  }

  async execute(
    params: ExecuteRequest,
    schemas?: {input?: any, output?: any}
  ): Promise<ExecuteResponse> {
    const {values, ...rest} = params
    const parameters = this.#transformRequest(values, schemas?.input)
    try {
      const response = await rds.executeStatement({
        ...this.#defaults,
        ...this.#overrides,
        ...rest,
        parameters
      })
      return this.#transformResponse(response)
    } catch (err: any) {
      // drop & create not working sometimes, need to figure this out
      if (~err?.message?.indexOf("is being accessed by other users")) {
        return []
      }
      throw err
    }
  }

  #transformRequest(values: ExecuteRequest["values"], schema: any): SqlParameter[] {
    if (!values) { return [] }
    return Object.keys(values).map((key: string) => {
      let value = values[key]
      const typeof_ = typeof value
      // isNull, booleanValue, longValue, doubleValue, stringValue, blobValue, arrayValue, $unknown
      let sqlType = typeof_ === "string" ? "stringValue"
        : typeof_ === "number" ? "doubleValue"
        : typeof_ === "boolean" ? "booleanValue"
        : "stringValue"
      // DATE, DECIMAL, JSON, TIME, TIMESTAMP, UUID
      let typeHint: TypeHint | undefined = undefined
      if (schema?.shape[key]) {
        const shape = schema.shape[key]
        // shape instanceof z.ZodString
        typeHint = shape.isUUID ? TypeHint.UUID : undefined
      }
      console.log(key, sqlType, value)
      return {
        name: key,
        value: {
          [sqlType]: value
        } as Field,
        typeHint
      }
    })
  }

  #transformResponse(response: ExecuteStatementCommandOutput): any[] {
    if (!response.records) {return []}
    if (!response.columnMetadata) {return []}
    return response.records.map((fields) =>
      Object.fromEntries(fields.map((field, i) => {
        const key: string = response.columnMetadata![i].name
        const [hint, val] = Object.entries(field)[0]
        const value = hint === 'isNull' ? undefined
          : val // any other edge-cases?
        return [key, value]
      }))
    )
  }

  async init(): Promise<void> {
    const db = this.#overrides?.database
    if (!db) {return}
    await this.execute({
      sql: `DROP DATABASE IF EXISTS ${db}`,
      database: undefined
    })
    await this.execute({
      sql: `CREATE DATABASE ${db}`,
      database: undefined,
    })
    const sql = readFileSync('src/data/init.sql', {encoding: 'utf-8'})
    await this.execute({sql})
  }

  async drop(): Promise<void> {
    const db = this.#overrides?.database
    if (!db) {return}
    await this.execute({
      sql: `DROP DATABASE IF EXISTS ${db}`,
      database: undefined
    })
  }
}



