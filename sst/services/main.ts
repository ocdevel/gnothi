import {
  APIGatewayProxyResultV2,
  Handler,
  Context,
  APIGatewayProxyHandlerV2WithJWTAuthorizer,
  APIGatewayProxyWebsocketEventV2WithRequestContext
} from "aws-lambda"
import {Routes, Api, Events, Users} from '@gnothi/schemas'
import {Handlers} from './aws/handlers'
import * as auth from './auth/appAuth'

import './routes'
import {CantSnoop} from "./routes/errors";

async function handleRes(
  def: Api.DefO<any>,
  res: Api.Res,
  fnContext: Api.FnContext
): Promise<APIGatewayProxyResultV2> {
  let final: APIGatewayProxyResultV2 = {statusCode: 200}
  console.log("handleRes", res)
  await Promise.all(
    Object.entries(def.t).map(async ([trigger, enabled]) => {
      if (!enabled) {return null}
      const handler = Handlers.handlers[trigger]
      const responded = await handler.respond(res, fnContext)
      if (trigger === "http" || trigger === "lambda") {
        final = responded
      }
  }))
  return final
}

async function handleReq(
  req: Api.Req,
  fnContext: Api.FnContext
): Promise<APIGatewayProxyResultV2> {
  let final: APIGatewayProxyResultV2 = {statusCode: 200}
  // handling was skipped, eg OPTIONS or favicon
  if (!req) {return final}

  console.log("handleReq", req)
  const route = Routes.routes[req.event]
  if (!route) {
    console.error("No route for", req.event)
    return
  }
  if (fnContext.snooping && !route.snoopable) {
    throw new CantSnoop()
  }

  let output
  try {
    output = await route.fn(req.data, fnContext)
  } catch (e) {
    debugger
    throw e
  }

  const res: Api.Res = {
    error: false,
    code: 200,
    data: output,
    event: route.o.e,
    keyby: route.o.keyby
    // TODO op, event_as
  }

  return await handleRes(route.o, res, fnContext)
}

// export const main: Handler<any, APIGatewayProxyResultV2> = async (event, context, callback) => {
export const main = async (awsEvent: APIGatewayProxyWebsocketEventV2WithRequestContext<any>, awsContext) => {
  let final: APIGatewayProxyResultV2 = {statusCode: 200}
  const {user, handled} = await auth.getUser(awsEvent, awsContext)
  if (handled) { return final }

  if (!user) {
    throw new Error("User not found in appAuth.ts")
  }

  const fnContext: Api.FnContext = {
    user: user,
    viewer: user,
    snooping: false, // TODO
    // TODO handle this later instead, set toUids or something which pulls from DB
    connectionId: awsEvent.requestContext?.connectionId,
    handleReq,
    handleRes
  }

  const triggerIn = Handlers.whichHandler(awsEvent, awsContext)
  const handler = Handlers.handlers[triggerIn]
  const reqs = await handler.parse(awsEvent)

  // return await Promise.all(reqs.map(async (req) => handleReq(req, fnContext)))
  await Promise.all(reqs.map(async (req) => handleReq(req, fnContext)))
  return final
}
