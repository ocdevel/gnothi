import {z} from "zod";
import {TextDecoder} from "util";
import {InvokeCommand, InvokeCommandInput, InvokeCommandOutput, LambdaClient} from "@aws-sdk/client-lambda";
import {Readable} from "stream";
import {GetObjectCommand, PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import {
  Callback,
  Context,
  APIGatewayProxyResultV2,
  APIGatewayProxyEventV2,
  APIGatewayEvent,
  ScheduledEvent,
} from "aws-lambda";
import type {BaseTriggerEvent} from "aws-lambda/trigger/cognito-user-pool-trigger/_common";
import {Api, Events} from '@gnothi/schemas';
import {Function} from 'sst/node/function'
import {clients} from './clients'
import {SNSEvent} from "aws-lambda";
import {APIGatewayProxyWebsocketEventV2} from "aws-lambda/trigger/api-gateway-proxy";
import {fromUtf8, toUtf8} from "@aws-sdk/util-utf8-node";
import {Bucket} from 'sst/node/bucket'
import _ from "lodash";
import {Logger} from './logs'
import {wsConnections} from "../data/schemas/wsConnections";
import {FnContext} from "../routes/types";
import {eq} from "drizzle-orm";

export * as Handlers from './handlers'

//const defaultBucket = Bucket.Bucket.bucketName

abstract class Handler<E = any> {
  abstract match(req: E): boolean
  abstract parse(event: E): Promise<Array<null | Api.Req>>
  abstract respond(res: Api.Res, context: Api.FnContext): Promise<APIGatewayProxyResultV2>
}

function proxyRes(res: Api.Res): APIGatewayProxyResultV2 {
  if (res.error) {
    return {statusCode: res.code, body: `${res.data} - ${res.event}`}
  }
  return {statusCode: 200, body: JSON.stringify(res)}
}

// TODO revisit, I can't figure this out
// export class SNS<E extends SNSEvent> extends Handler<E> {
class SnsHandler extends Handler<SNSEvent> {
  match(req) {
    // return req.Records?.[0]?.EventSource === 'aws:sns'
    return !!req.Records?.[0]?.Sns?.Message
  }

  async parse(event) {
    const parsed = z.object({
      Records: z.array(
        z.object({
          Sns: z.object({
            Message: Api.AnyToObj,
            MessageAttributes: z.record(z.string(), z.object({
              Type: z.string(),
              Value: z.string()
            })).optional(),
          })
        })
      )
    }).parse(event)
    return parsed.Records.map(({Sns}) => {
      if (Sns.Message.eventName === "TestNotification") {
        return null
      }
      return {
        trigger: "sns",
        event: Sns.MessageAttributes?.event?.Value || "sns_notif",
        data: Sns.Message
      }
    })
  }

  // https://docs.aws.amazon.com/lambda/latest/dg/with-sns.html
  async respond(res) {
    return proxyRes(res)
  }
}
const sns = new SnsHandler()

class Buff {
  static fromObj(obj: unknown): Uint8Array {
    return fromUtf8(JSON.stringify(obj))
  }

  // public static objFromBuff(buff: Buffer): object {
  static toObj(buff: Uint8Array): unknown {
    return JSON.parse(toUtf8(buff))
  }
}

type S3GetObjectContents = { Bucket: string, Key: string }
export async function s3GetObjectContents({Bucket, Key}: S3GetObjectContents): Promise<string> {
  const response = await clients.s3.send(new GetObjectCommand({
    Bucket,
    Key
  }))
  const Body = response.Body as Readable
  return new Promise<string>((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    Body.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    Body.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    Body.on("error", reject);
  });
}

type InvokeCommandOutput_<O> = Omit<InvokeCommandOutput, 'Payload'> & {
  Payload: O | null
}
export async function lambdaSend<O = any>(
  data: object,
  FunctionName: string,
  InvocationType: InvokeCommandInput['InvocationType']
): Promise<InvokeCommandOutput_<O>> {
  const response = await clients.lambda.send(new InvokeCommand({
    InvocationType,
    Payload: Buff.fromObj(data),
    FunctionName,
  }))
  const Payload = InvocationType === "Event" ? null
      : Buff.toObj(response.Payload) as O
  if (response.FunctionError) {
    const Error = Payload as {errorType: string, errorMessage: string, stackTrace: string[]}
    const error = `${Error.errorType}: ${Error.errorMessage}`
    Logger.error({message: error, data: Error.stackTrace, event: "aws/handlers#lambdaSend"})
    throw error
  }
  return {
    ...response,
    // Revisit how to decode the Payload. Buffer vs Uint8Array?
    Payload
  }
}

class LambdaHandler extends Handler<any> {
  match(event) {return true}

  async parse(event) {return [event]}

  // If this is a response handler, it should kick off as a background job (InvocationType:Event).
  // If you want RequestResponse, call directly via above helper function
  async respond(res, context) {
    const req = {
      ...res,
      // responses are sent to http/ws as a list (always). If sending to Lambda,
      // unpack it since we'll be sending just one object
      data: res.data[0]
    }
    const backgroundReq = {
      req,
      context: {
        user: context.user,
        connectionId: context.connectionId,
      }
    }
    const response = await lambdaSend(
      backgroundReq,
      Function.FnBackground.functionName,
      "Event"
    )
    return {statusCode: response.StatusCode, body: response.Payload}
  }
}
const lambda = new LambdaHandler()

class WsHandler extends Handler<APIGatewayProxyWebsocketEventV2> {
  match(event) {
    return !!event.requestContext?.connectionId
  }

  async parse(event){
    const parsed = z.object({
      requestContext: z.object({
        connectionId: z.string(),
        routeKey: z.string(), // $connect, $disconnect, $default, other (based on websocketApiRouteSelectionExpression)
      }),
      body: Api.AnyToObj
    }).parse(event)
    return [{
      trigger: 'ws',
      // connectionId: val.requestContext.connectionId,
      ...parsed.body
    }]
  }

  async respondOne(res: Api.Res, {connectionId}: Partial<FnContext>) {
   if (!connectionId) {
     console.warn("Trying to to WS without connectionId")
     return
    }
    try {
      // The maximum message payload size that an API Gateway WebSocket connection can send to a client is 128 KB.
      // However, due to the WebSocket frame size quota of 32 KB, a message larger than 32 KB must be split into
      // multiple frames, each 32 KB or smaller. If a larger message (or larger frame size) is received, the
      // connection is closed with code 1009
      // https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html

      // We should really stop using it for the entire app's network backbone, and instead have it inform the client
      // to re-fetch new data as needed (only sending notifications, pings). For now, if we're returning an array
      // (which should always be true), and it's longer then CHUNK_SIZE, send in chunks. This is brittle since it
      // assumes {op: "update"} was the original intent, and {op: "append"} is safe.
      const CHUNK_SIZE = 20

      // should always be an array, but you can never be too careful
      const isArr = Array.isArray(res.data) // will be false if we have an error
      const dataChunks = isArr ? _.chunk(res.data, CHUNK_SIZE) : res.data;
      const isChunking = isArr && dataChunks.length > 1
      const resChunks = !isChunking ? [res]
        : dataChunks.map((chunk, i) => {
          if (i === 0) {return {...res, data: chunk}}
          return {...res, op: "append", data: chunk}
        })
      for (const chunk of resChunks) {
        // The last chunk is sometimes empty. Don't send it. Only do that if we are indeed chunking
        if (isChunking && !chunk.data?.length) {continue}

        await clients.apig.send(new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: Buff.fromObj(chunk),
        }))
      }
    } catch (error) {
      if (error.name === 'GoneException') {
        // They user may have closed the tab. Don't want to throw an error, but we do want to log it just in case
        // there's more error here than meets the eye
        res.error = true
        res.code = 500
        Logger.warn({
          message: "WebSocketError: trying to send to disconnected client.",
          data: res,
          event: res.event
        })
      } else {
        throw error // Re-throw the error if it's not a GoneException
      }
    }
  }

  async respond(res, context): Promise<APIGatewayProxyResultV2> {
    // At this point we have context.connection, but it may have been lost depending on how long the function took.
    // Also, the user may be connected on multiple devices.
    const connections = await context.db.drizzle
      .select({connectionId: wsConnections.connection_id})
      .from(wsConnections)
      .where(eq(wsConnections.user_id, context.uid))
    await Promise.all(connections.map(async ({connectionId}) => {
      return this.respondOne(res, {connectionId})
    }))
    return proxyRes(res)
  }
}
const ws = new WsHandler()

class HttpHandler extends Handler<APIGatewayProxyEventV2> {
  match(event) {
    return !!event?.requestContext?.http?.method
  }

  async parse(event) {
    if (event.rawPath === '/favicon.ico'
      || event.requestContext.http.method === "OPTIONS") {
      return [null]
    }

    // https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html#apigateway-example-event
    const parsed = z.object({
      requestContext: z.object({
        http: z.object({
          method: z.string(),
          path: z.string(),
        }),
      }),
      body: Api.AnyToObj
    }).parse(event)
    return [{
      trigger: 'http',
      ...parsed.body
    }]
  }

  async respond(res): Promise<APIGatewayProxyResultV2> {
    return proxyRes(res)
  }
}
const http = new HttpHandler()

class CronHandler extends Handler<ScheduledEvent> {
  match (event) {
    return event.source === "aws.events"
  }
  // match: (event) => event['detail-type'] === "Scheduled Event",

  async parse(event) {
    // FIXME no easy way to inform the CDK construct to pass something along. A tag? for now, I'll just match-make
    // based on the rule which triggered this function
    const eventKey = event.resources[0].toLowerCase().includes("habitica") ? "habitica_sync_cron"
      : undefined // will need this error as I flesh out more crons
    return [{data: event, event: eventKey, trigger: "cron"}]
  }

  async respond(res: any): Promise<APIGatewayProxyResultV2> {
    return proxyRes(res)
  }
}
const cron = new CronHandler()

export class Cognito extends Handler<BaseTriggerEvent<any>> {
  match(event) {
    return !!(event.userPoolId && event.triggerSource)
  }
  async parse(event) { return [event] }
  async respond(res: any) { return {statusCode: 200, body: "OK"} }
}
const cognito = new Cognito()

// Edge-case. Make sure this goes before HTTP, since that will match first
export class Stripe extends Handler<APIGatewayProxyEventV2> {
  match(event) {
    return event.routeKey === "POST /stripe/webhook"
  }
  async parse(event) {
    return [{
      trigger: 'stripe',
      event: "stripe_webhook_request",
      data: event
    }]
  }
  async respond(res: any) {
    return proxyRes(res)
  }
}
const stripe = new Stripe()

type HandlerKey = "http" | "s3" | "sns" | "lambda" | "ws" | "cron" | "cognito" | "stripe"
export function whichHandler(event: any, context: Context): HandlerKey {
  // TODO would multiple triggers ever hit the same Lambda at once?
  if (stripe.match(event)) {return "stripe"}
  if (sns.match(event)) {return "sns"}
  if (ws.match(event)) {return "ws"}
  if (http.match(event)) {return "http"}
  if (cron.match(event)) {return "cron"}
  if (cognito.match(event)) {return "cognito"}
  // if (S3.match(event)) {return new S3()}
  return "lambda"
}

export const handlers: Record<keyof Api.Trigger, Handler> = {
  // cognito,
  stripe,
  ws,
  http,
  // sns,
  // s3,
  cron,
  background: lambda,
}
