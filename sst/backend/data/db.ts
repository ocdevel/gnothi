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

interface DBArgs {
  resourceArn: string
  database: string
  schema?: string
  secretArn: string
}

interface DBOverrides {
  resourceArn?: string
  database?: string
  schema?: string
  secretArn?: string
}

interface Statement {
  sql: string
  parameters: SqlParameter[]
}
type Statements = Statement[]

export class DB {
  #dbArgs: DBArgs = {
    resourceArn: process.env[envKeys.db.cluster]!,
    secretArn: process.env[envKeys.db.secret]!,
    database: process.env[envKeys.db.database]! // 'information_schema'process.env[envKeys.db.database]; // 'information_schema'
  }

  #statements: Statements = []
  #transactionId: string | undefined = undefined
  #i: number = 0

  constructor(overrides: DBOverrides) {
    this.#dbArgs = {...this.#dbArgs, ...overrides}
  }

  async beginTransaction() {
    const {transactionId} = await rds.beginTransaction(this.#dbArgs)
    this.#transactionId = transactionId
  }

  async commitTransaction() {
    const {transactionStatus} = await rds.commitTransaction({
      ...this.#dbArgs,
      transactionId: this.#transactionId,
    })
    this.#transactionId = undefined
    this.#statements = []
  }

  async rollbackTransaction() {
    await rds.rollbackTransaction({
      resourceArn: this.#dbArgs.resourceArn,
      secretArn: this.#dbArgs.secretArn,
      transactionId: this.#transactionId
    })
    this.#transactionId = undefined
    this.#statements = []
  }

  async insert(table: string, values: Record<string, any>): Promise<ExecuteResponse> {
    const keys = Object.keys(values)
    const cols = keys.join(', ')
    const placeholders = keys.map(k => {
      return `:${k}${this.#transactionId ? this.#i : ""}` // :name or :name1
    }).join(', ')
    const sql = `insert into ${table} (${cols}) values (${placeholders}) returning *;`
    return await this.execute({sql, values})
  }

  async execute<
    I extends z.ZodTypeAny,
    O extends z.ZodTypeAny
  >(
    params: ExecuteRequest & {
      zIn?: z.TypeOf<I>
      zOut?: z.TypeOf<O>
    }
  ): Promise<z.TypeOf<O>> {
    const {values, zIn, zOut, ...rest} = params
    const parameters = this.#transformRequest(values, zIn)
    try {
      const response = await rds.executeStatement({
        includeResultMetadata: true,
        ...this.#dbArgs,
        ...rest,
        parameters
      })
      const rows = this.#transformResponse(response, zOut)
      return rows
    } catch (err: any) {
      // drop & create not working sometimes, need to figure this out
      if (~err?.message?.indexOf("is being accessed by other users")) {
        return []
      }
      throw err
    }
  }

  #transformRequest<T extends z.AnyZodObject>(values: ExecuteRequest["values"], schema?: T): SqlParameter[] {
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

  #transformResponse<T extends z.AnyZodObject>(
    response: ExecuteStatementCommandOutput,
    schema?: T
  ): T[] | any[] {
    if (!response.records) {return []}
    if (!response.columnMetadata) {return []}
    const rows = response.records.map((fields) =>
      Object.fromEntries(fields.map((field, i) => {
        const key: string = response.columnMetadata![i].name
        const [hint, val] = Object.entries(field)[0]
        const value = hint === 'isNull' ? undefined
          : val // any other edge-cases?
        return [key, value]
      }))
    )
    if (!schema) {return rows}
    return rows.map(row => schema.parse(row))
  }

  async init(): Promise<void> {
    const db = this.#dbArgs?.database
    if (!db) {return}
    // await this.drop()
    await this.execute({
      sql: `CREATE DATABASE ${db};`,
      database: undefined,
    })
    const sql = readFileSync('src/data/init.sql', {encoding: 'utf-8'})
    await this.execute({sql})
  }

  async drop(): Promise<void> {
    const db = this.#dbArgs?.database
    if (!db) {return}
    await this.execute({
      sql: `DROP DATABASE IF EXISTS ${db};`,
      database: undefined
    })
  }
}



