 import {APIGatewayProxyHandlerV2} from "./aws";
import { DB } from '../data/db'
import * as m from '../data/models'
import {APIGatewayProxyEventV2} from "aws-lambda/trigger/api-gateway-proxy";
import router from './router'
import { z } from 'zod'
import {RouteBody} from '../data/schemas'
import {Context} from './types'
import _set from 'lodash/set'

const routeWs: APIGatewayProxyHandlerV2 = async (event, context, callback) => {
  if (!event.body) {return ''}
  const body: RouteBody = JSON.parse(event.body)
  const db = context.clientContext!.Custom!.db
  return await router(body, {db})
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context, callback) => {
  const {routeKey, connectionId} = event.requestContext
  const db = new DB()

  let res
  // TODO is connectionId present with all WS requests?
  if (routeKey === '$connect' && connectionId) {
    await m.WsConnection.connect(db, connectionId, 'abc')
    res = `${connectionId} connected`
  } else if (routeKey === '$disconnect' && connectionId) {
    await m.WsConnection.disconnect(db, connectionId)
    res = `${connectionId} disconnected`
  } else if (routeKey === '$default') {
    _set(context, 'clientContext.Custom.db', db)
    res = await routeWs(event, context, callback)
  } else {
    throw "REST routes not yet supported"
  }
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: res
  };
};

