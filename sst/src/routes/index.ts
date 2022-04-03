import {APIGatewayProxyHandlerV2} from "./aws";
import {connect, disconnect} from './ws'
import { DB } from '../data/index'

const main = async () => {
  return ''
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context, callback) => {
  const {routeKey, connectionId} = event.requestContext
  const db = new DB()
  let res
  // TODO is connectionId present with all WS requests?
  if (routeKey === '$connect' && connectionId) {
    res = await connect(db, connectionId, 'abc')
  } else if (routeKey === '$disconnect' && connectionId) {
    res = await disconnect(db, connectionId)
  } else if (routeKey === '$default') {
      res = await main()
  } else {
    throw "REST routes not yet supported"
  }
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: res
  };
};

