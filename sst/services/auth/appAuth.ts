/**
 * After the Cognito hooks, we'll use these functions to connect/disconnect
 * the user; and fetch the user by jwt
 */

import {
  APIGatewayProxyHandlerV2WithJWTAuthorizer,
  APIGatewayProxyEventV2WithJWTAuthorizer,
  Context,
  APIGatewayProxyWebsocketEventV2WithRequestContext
} from "aws-lambda";
import {db} from '../data/db'
import {User} from '@gnothi/schemas/users'
import {WsConnection} from "@gnothi/schemas/ws";

// Typehint picks up a UUID, but cognito_id is stored as varchar (in case they
// change, since we have no control). un-hint it by not using kysley
async function fromCognito(cognito_id: string, justId=false) {
  const res = await db.exec({
    sql: `select ${justId ? "id" : "*"} from users where cognito_id = :cognito_id`,
    values: {cognito_id},
    zOut: User
  })
  return res[0]
}

type GetUser = {
  handled: boolean
  user?: User
}
export async function getUser(event: APIGatewayProxyWebsocketEventV2WithRequestContext<any>, context: Context) : Promise<GetUser> {
  // Check if exists from custom websocket authorizer
  const cognitoId = event.requestContext?.authorizer?.userId ||
    // or from outa-the-box HTTP jwt authorizer
    event.requestContext.authorizer?.jwt?.claims?.sub;
  const routeKey = event.requestContext?.routeKey
  const connection_id = event.requestContext?.connectionId

  // return this if this function did everything the call needed; don't continue.
  // Eg, ws connect & disconnect handle everything here
  const handled = {handled: true}

  if (connection_id) {
    if (routeKey == "$connect") {
      const user = await fromCognito(cognitoId, true)
      await db.exec({
        sql: `insert into ws_connections (user_id, connection_id) values (:user_id, :connection_id)`,
        values: {user_id: user.id, connection_id},
        zIn: WsConnection
      })
      return handled
    } else if (routeKey === "$disconnect") {
      await db.exec({
        sql: "delete from ws_connections where connection_id=:connection_id",
        values: {connection_id},
        zIn: WsConnection
      })
      return handled
    }
  }

  const user = (await db.exec({
    sql: `
      select u.*
      from users u
             inner join ws_connections wc on u.id = wc.user_id
      where wc.connection_id = :connection_id;
    `,
    values: {connection_id},
    zIn: User,
    zOut: User
  }))[0]
  return {handled: false, user}
}
