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
import {db} from './data/dbSingleton'
import {User, users} from './data/schemas/users'
import {Logger} from "./aws/logs";

// only log requests and responses in dev/staging/test. Prod would otherwise collect into CloudWatch Logs, which
// is bad privacy. Means harder to debug prod issues, but I'll figure something out.
const LOG_REQ_RES = !~['prod', 'production'].indexOf(process.env.SST_STAGE)

const defaultResponse: APIGatewayProxyResultV2 = {statusCode: 200, body: "{}"}
type RecordResult = APIGatewayProxyResultV2 | null

// ------- Step 1: Proxy event from AWS -------
// Takes AWS proxy events (APIG WS/HTTP, SNS, etc) and passes them to the main function.
// Reason for the hop is we can call the main function directly via Lambda, which
// needs to forward on variables like `user`

// export const main: Handler<any, APIGatewayProxyResultV2> = async (event, context, callback) => {
export async function proxy(
  event: APIGatewayProxyWebsocketEventV2WithRequestContext<any>,
  context
): Promise<APIGatewayProxyResultV2> {
  const triggerIn = Handlers.whichHandler(event, context)

  // TODO need to have a better system for non-user routes (cron, lambda, sns, etc)
  const {user, handled} = (triggerIn === 'cron')
    ? auth.noUser()
    : await auth.getUser(event, context, db)

  if (handled) { return defaultResponse }

  const handler = Handlers.handlers[triggerIn]
  const records = await handler.parse(event)
  const responses = await Promise.all(records.map(async req => {
    return main({
      req,
      context: {
        connectionId: event.requestContext?.connectionId,
        user,
      }
    })
  }))
  return responses.find(r => !!r) || defaultResponse
}

// ------- Step 2: Main handler of event -------
// Either handle one record from the AWS proxy event, or handle a Lambda directly
type ReqParsed = {
  req: Api.Req,
  context: {
    connectionId?: string
    user: User
  }
}
export async function main({req, context}: ReqParsed): Promise<RecordResult> {
  const {connectionId, user} = context
  if (!user) {
    throw new Error("User not found in appAuth.ts")
  }

  const fnContext = new FnContext({
    db,
    user,
    // TODO later when we add sharing, use `req.as_user`. Currently forcing it off by using uid
    vid: user.id,
    connectionId,
    // TODO handle this later instead, set toUids or something which pulls from DB
    handleReq,
    handleRes,
  })
  await fnContext.init()

  return await handleReq(req, fnContext)

}

// ------- Step 3: Main handler of event -------
// Handle individual request. Separate function than above so we can pass itself
// around to sub routes
const handleReq: FnContext['handleReq'] = async (req, fnContext) => {
  // handling was skipped, eg OPTIONS or favicon
  if (!req) {return null}

  // Logger.info({event: req.event, data: req, message: "handleReq"} )
  Logger.metric({event: req.event, user: fnContext.user} )
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
    Logger.error({message: e.toString(), data: e.stackTrace, event: req.event})
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
  // Logger.info({data: res, event: def.e} )
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
        // Logger.info({data: handlerRes, event: def.e, message: "final=handlerRes"} )
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
