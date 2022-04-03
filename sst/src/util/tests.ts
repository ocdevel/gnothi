import {MyProxyEvent} from "../routes/aws"

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
