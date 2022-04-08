import {MyProxyEvent} from "../routes/aws"
import {DB} from '../data/db'

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

// export mockUsers = {
//   me: {id: 'xxx', email: 'me@x.com'},
//   friend: {id: 'xxx', email: 'friend@x.com'},
//   stranger: {id: 'xxx', email: 'stranger@x.com'}
// }
// export const createUsers = async (users: any[]) {
//   await
// }

;
export const withDb = async (name: string, fn: (db: any) => Promise<any>) => {
  const db = new DB({database: name})
  await db.init()
  return async () => fn(db)
}
