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
// @ts-ignore
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

type SqlParameter_ = SqlParameter & {
  arrayFix?: "=" | "IN"
}
interface Statement {
  sql: ExecuteStatementCommandInput['sql']
  parameters: SqlParameter_[]
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

  async executeStatement<O = object>(statement: Statement): Promise<O[]> {
    const {sql, parameters} = this.arrayValueFix(statement)
    try {
      const response = await rdsClient.executeStatement({
        includeResultMetadata: true,
        continueAfterTimeout: true,
        ...this.driver,
        sql,
        parameters
      })
      const rows = this.transformRes(response)
      return rows as O[]
    } catch (err: any) {
      console.log({sql, parameters})
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
        continueAfterTimeout: true,
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

  transformReq<T extends z.AnyZodObject>(values: ExecReq["values"], schema?: T): SqlParameter_[] {
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
        const [sqlType, val] = Object.entries(field)[0]
        const shape = schema?.shape?.[key]
        const value = shape?.isDate ? dayjs(val).toDate()
            : sqlType === "isNull" ? undefined
            : sqlType === "arrayValue" ? Object.values(val)[0]
            : val
        return [key, value]
      }))
    )
    if (!schema) {return rows}
    return rows.map(row => schema.partial().parse(row))
  }

  // arrayValue doesn't work in rds-data-client, even though it's part of the documentation. Just says "not supported"
  // https://github.com/aws/aws-sdk/issues/9#issuecomment-1104182976
  // TODO support multiple datatypes (currently only supports string)
  arrayValueFix({sql, parameters}: Statement): Statement {
    let fixedSql = sql
    let fixedParameters: ExecuteStatementCommandInput["parameters"] = []
    let offset = 0
    parameters.forEach((parameter, i) => {
      if (!parameter.value.arrayValue) {
        fixedParameters.push(parameter)
        return // all good, carry on
      }
      const values = parameter.value.arrayValue.stringValues
      if (!values) {
        throw "Currently only applied arrayValue for stringValues. Fix this if need other array value-types"
      }
      const paramsSeparate = values.map((value, idx) => ({
        name: `id${idx + offset}`,
        value: {stringValue: value},
        typeHint: parameter.typeHint
      }))
      // @ts-ignore
      const placeholder = [...Array(values.length).keys()]
        .map(idx => `:id${idx + offset}`).join(',')
      offset += values.length
      const placeholderWrap = parameter.arrayFix === "=" ? `ARRAY[${placeholder}]`
        : `(${placeholder})`
      fixedSql = fixedSql.replace(
        `:${parameter.name}`,
        placeholderWrap
      )
      fixedParameters = [...fixedParameters, ...paramsSeparate]
    })
    return {sql: fixedSql, parameters: fixedParameters}
  }
}

export const db = new DB({})
