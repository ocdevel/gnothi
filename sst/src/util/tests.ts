import {MyProxyEvent} from "../routes/aws"
import {DB} from '../data/db'
import {Context} from "../routes/types";

export const request = (requestContext: any): [MyProxyEvent, any, any] => {
  const [str, num] = ['abc', 123]
  return [{
    version: str,
    routeKey: str,
    rawPath: str,
    rawQueryString: str,
    headers: {},
    isBase64Encoded: false,
    requestContext: {
      accountId: str,
      apiId: str,
      authorizer: null,
      protocol: str,
      httpMethod: 'GET',
      identity: str,
      path: str,
      stage: str,
      requestId: str,
      requestTimeEpoch: num,
      resourceId: str,
      resourcePath: str,
      ...requestContext
    }
  }, undefined, undefined]
}


type InnerFn = (context: Context) => Promise<unknown>
type ProvidesCallback = () => Promise<unknown>
export const withDB = (name: string, fn: InnerFn): ProvidesCallback  => {
  return async () => {
    const database = (name + (+new Date).toString()).replace(/[\W]/g, '')
    const db = new DB({database})
    await db.init()
    const context = {db}
    await fn(context)
    await db.drop()
  }
}
