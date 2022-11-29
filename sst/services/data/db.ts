import {
  RDSData,
  ExecuteStatementCommandOutput,
  ResultSetOptions,
  SqlParameter,
  Field,
  TypeHint, ExecuteStatementCommandInput,
} from "@aws-sdk/client-rds-data";
// import {readFileSync} from "fs";
// import _map from 'lodash/'
// import _reduce from 'lodash/reduce'
import {z} from 'zod'
import { RDS } from "@serverless-stack/node/rds";
import * as S from '@gnothi/schemas'
import dayjs from 'dayjs'

const dbSchema = {
  users: S.Users.User,
  ws_connections: S.Ws.WsConnection,
  tags: S.Tags.Tag,
  entries: S.Entries.Entry,
  entries_tags: S.Tags.EntryTag,
  fields: S.Fields.Field,
  field_entries: S.Fields.FieldEntry,
  groups: S.Groups.Group,
  shares: S.Shares.Share,
  shares_tags: S.Shares.ShareTag,
  shares_users: S.Shares.ShareUser,
  notifs: S.Notifs.Notif,
}

export const driver = {
  secretArn: RDS.db.secretArn,
  resourceArn: RDS.db.clusterArn,
  database: RDS.db.defaultDatabaseName,
}

export const rdsClient: RDSData = new RDSData({ region: process.env.AWS_REGION });

interface DBArgs {
  resourceArn: string
  database: string
  secretArn: string
  schema?: string
}

interface Statement {
  sql: string
  parameters: SqlParameter[]
}
type Statements = Statement[]

interface ExecReq {
  database?: string
  sql: string
  values?: {[k: string]: any}
}

type ExecRes = any[]

export class DB {
  private driver: DBArgs = {
    secretArn: driver.secretArn,
    resourceArn: driver.resourceArn,
    database: driver.database, // 'information_schema'process.env[envKeys.db.database]; // 'information_schema'
  }

  private statements: Statements = []
  private transactionId: string | undefined = undefined
  private i: number = 0

  constructor(overrides: Partial<DBArgs>) {
    this.driver = {...this.driver, ...overrides}
  }

  async insert(table: keyof typeof dbSchema, values: Record<string, any>): Promise<ExecRes> {
    const keys = Object.keys(values)
    const cols = keys.join(', ')
    // const placeholders = keys.map(k => {
    //   return `:${k}${this.#transactionId ? this.#i : ""}` // :name or :name1
    // }).join(', ')
    const placeholders = keys.map(k => `:${k}`).join(', ')
    const sql = `insert into ${table} (${cols}) values (${placeholders}) returning *;`
    return await this.exec({
      sql,
      values,
      zIn: dbSchema[table],
      zOut: dbSchema[table]
    })
  }

  async executeStatement({sql, parameters}: Pick<ExecuteStatementCommandInput, 'sql' | 'parameters'>): Promise<object[]> {
    try {
      const response = await rdsClient.executeStatement({
          includeResultMetadata: true,
          ...this.driver,
          sql,
          parameters
        })
        const rows = this.transformRes(response)
        return rows
    } catch (err: any) {
      debugger
      throw err
    }
  }

  async exec<
    I extends z.ZodTypeAny,
    O extends z.ZodTypeAny
  >(
    props: ExecReq & {
      zIn?: z.TypeOf<I>
      zOut?: z.TypeOf<O>
    }
  ): Promise<z.TypeOf<O>[]> {
    const {values, zIn, zOut, ...rest} = props
    const parameters = this.transformReq(values, zIn)
    try {
      const response = await rdsClient.executeStatement({
        includeResultMetadata: true,
        ...this.driver,
        ...rest,
        parameters
      })
      const rows = this.transformRes(response, zOut)
      return rows
    } catch (err: any) {
      // drop & create not working sometimes, need to figure this out
      if (~err?.message?.indexOf("is being accessed by other users")) {
        return []
      }
      throw err
    }
  }

  transformReq<T extends z.AnyZodObject>(values: ExecReq["values"], schema?: T): SqlParameter[] {
    if (!values) { return [] }
    return Object.keys(values).map((key) => {
      let value = values[key]
      const typeof_ = typeof value
      // isNull, booleanValue, longValue, doubleValue, stringValue, blobValue, arrayValue, $unknown
      let sqlType = typeof_ === "string" ? "stringValue"
        : typeof_ === "number" ? "doubleValue"
        : typeof_ === "boolean" ? "booleanValue"
        : "stringValue"
      // DATE, DECIMAL, JSON, TIME, TIMESTAMP, UUID
      let typeHint: TypeHint | undefined = undefined
      if (schema?.shape?.[key]) {
        const shape = schema.shape[key]
        // shape instanceof z.ZodString
        // TODO add the others
        typeHint = shape.isUUID ? TypeHint.UUID : undefined
      }
      return {
        name: key,
        value: {
          [sqlType]: value
        } as Field,
        typeHint
      }
    })
  }

  transformRes<T extends z.AnyZodObject>(
    response: ExecuteStatementCommandOutput,
    schema?: T
  ): T[] | any[] {
    if (!response.records?.length) {return []}
    if (!response.columnMetadata?.length) {return []}
    const rows = response.records.map((fields) =>
      Object.fromEntries(fields.map((field, i) => {
        const key: string = response.columnMetadata![i].name
        const [hint, val] = Object.entries(field)[0]
        const shape = schema?.shape?.[key]
        const value = shape?.isDate ? dayjs(val).toDate()
            : hint === "isNull" ? undefined
            : val
        return [key, value]
      }))
    )
    if (!schema) {return rows}
    return rows.map(row => schema.partial().parse(row))
  }

  // arrayValue doesn't work in rds-data-client, even though it's part of the documentation. Just says "not supported"
  // https://github.com/aws/aws-sdk/issues/9#issuecomment-1104182976
  // TODO support multiple datatypes (currently only supports UUID)
  arrayValueFix(ids: string[]): [string, SqlParameter[]] {
    const parameters = ids.map((id, index) => ({
      name: `id${index}`,
      value: {stringValue: id},
      typeHint: "UUID"
    }))
    const placeholder = [...Array(ids.length).keys()].map(x => `:id${x}`).join(',')
    return [placeholder, parameters]
  }

  // async init(): Promise<void> {
  //   const db = this.#dbArgs?.database
  //   if (!db) {return}
  //   // await this.drop()
  //   await this.execute({
  //     sql: `CREATE DATABASE ${db};`,
  //     database: undefined,
  //   })
  //   const sql = readFileSync('src/data/init.sql', {encoding: 'utf-8'})
  //   await this.execute({sql})
  // }
  //
  // async drop(): Promise<void> {
  //   const db = this.#dbArgs?.database
  //   if (!db) {return}
  //   await this.execute({
  //     sql: `DROP DATABASE IF EXISTS ${db};`,
  //     database: undefined
  //   })
  // }
}

export const db = new DB({})
