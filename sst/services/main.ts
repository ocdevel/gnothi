import {
  APIGatewayProxyResultV2,
  Handler,
  Context,
  APIGatewayProxyHandlerV2WithJWTAuthorizer,
  APIGatewayProxyWebsocketEventV2WithRequestContext
} from "aws-lambda"
import {Api, Events, Users} from '@gnothi/schemas'
import {FnContext} from './routes/types'
import {Handlers} from './aws/handlers'
import * as auth from './auth/appAuth'
import routes from './routes'
import {CantSnoop, GnothiError} from "./routes/errors";
import {z} from 'zod'

const defaultResponse: APIGatewayProxyResultV2 = {statusCode: 200, body: "{}"}
type RecordResult = APIGatewayProxyResultV2 | null

type ReqParsed = {
  req: Api.Req,
  context: {
    connectionId?: string
    user: Users.User
  }
}

// ------- Step 1: Proxy event from AWS -------
// Takes AWS proxy events (APIG WS/HTTP, SNS, etc) and passes them to the main function.
// Reason for the hop is we can call the main function directly via Lambda, which
// needs to forward on variables like `user`

// export const main: Handler<any, APIGatewayProxyResultV2> = async (event, context, callback) => {
export async function proxy(
  event: APIGatewayProxyWebsocketEventV2WithRequestContext<any>,
  context
): Promise<APIGatewayProxyResultV2> {
  const {user, handled} = await auth.getUser(event, context)
  if (handled) { return defaultResponse }
  const triggerIn = Handlers.whichHandler(event, context)
  const handler = Handlers.handlers[triggerIn]
  const records = await handler.parse(event)
  const responses = await Promise.all(
    records.map(async req => main({
      req,
      context: {
        connectionId: event.requestContext?.connectionId,
        user,
      }
    }))
  )
  return responses.find(r => !!r) || defaultResponse
}

// ------- Step 2: Main handler of event -------
// Either handle one record from the AWS proxy event, or handle a Lambda directly
export async function main({req, context}: ReqParsed): Promise<RecordResult> {
  const {user} = context
  if (!user) {
    throw new Error("User not found in appAuth.ts")
  }
  return await handleReq(req, {
    ...context,
    viewer: context.user, // TODO
    snooping: false, // TODO
    // TODO handle this later instead, set toUids or something which pulls from DB
    handleReq,
    handleRes
  })

}

// ------- Step 3: Main handler of event -------
// Handle individual request. Separate function than above so we can pass itself
// around to sub routes
const handleReq: FnContext['handleReq'] = async (req, fnContext) => {
  // handling was skipped, eg OPTIONS or favicon
  if (!req) {return null}

  console.log("handleReq", req)
  const route = routes[req.event]
  if (!route) {
    throw new GnothiError({message: `No route found for ${req.event}`})
  }
  if (fnContext.snooping && !route.snoopable) {
    throw new CantSnoop()
  }

  let res: Partial<Api.Res<any>>
  try {
    const data = await route.fn(req.data, fnContext)
    res = {data}
  } catch (e) {
    res = {
      error: true,
      event: req.event,
      ...(e instanceof GnothiError ? {
        code: e.code,
        data: e.message
      } : {
        code: 500,
        data: e.toString()
      })
    }
    console.error(e)
    debugger
  }
  return await handleRes(
    route.o,
    res,
    fnContext
  )
}

// ------- Step 4: Send the final result -------
const handleRes: FnContext['handleRes'] = async (def, res, fnContext) => {
  let final: RecordResult = null
  console.log("handleRes", def.e, res)
  const resFull = {
    error: res.error || false,
    code: res.code || 200,
    data: res.data,
    event: res.event || def.e,
    keyby: def.keyby,
    event_as: def.event_as,
    op: def.op
  }
  await Promise.all(
    Object.entries(def.t).map(async ([trigger, triggerValue]) => {
      if (!triggerValue) {return}
      const handler = Handlers.handlers[trigger]
      const handlerRes = await handler.respond(resFull, fnContext)
      if (trigger === "http") {
        console.log("final=handlerRes", handlerRes)
        final = handlerRes
      }
  }))

  if (!final) {
    // This happens when calling the function directly, eg via tests. Otherwise an output trigger
    // should be explicitly specified
    return {statusCode: resFull.code, body: JSON.stringify(resFull)}
  }

  return final
}


