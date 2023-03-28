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
import {db} from '../data/dbSingleton'
import {User} from '@gnothi/schemas/users'
import {WsConnection} from "@gnothi/schemas/ws";
import {sql} from "drizzle-orm/sql"

// Typehint picks up a UUID, but cognito_id is stored as varchar (in case they
// change, since we have no control). un-hint it by not using kysley
async function fromCognito(cognito_id: string, justId=false) {
  const res = await db.queryFirst<User>(
    sql`select * from users where cognito_id=${cognito_id}`
  )
  return res
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
      const user = await fromCognito(cognitoId)
      await db.query(sql`
        insert into ws_connections (user_id, connection_id) 
        values (${user.id}, ${connection_id}) 
        on conflict do nothing
      `)
      return handled
    } else if (routeKey === "$disconnect") {
      await db.query(
        sql`delete from ws_connections where connection_id=${connection_id}`
      )
      return handled
    }
    const user = await db.queryFirst(sql`
      select u.*
      from users u
      inner join ws_connections wc on u.id = wc.user_id
      where wc.connection_id = ${connection_id};
    `)
    return {handled: false, user}
  }

  const user = await fromCognito(cognitoId)
  return {handled: false, user}
}
