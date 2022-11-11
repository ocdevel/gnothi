/**
 * After the Cognito hooks, we'll use these functions to connect/disconnect
 * the user; and fetch the user by jwt
 */

import {
  APIGatewayProxyHandlerV2WithJWTAuthorizer,
  APIGatewayProxyEventV2WithJWTAuthorizer, Context, APIGatewayProxyWebsocketEventV2WithRequestContext
} from "aws-lambda";
import {DB, raw} from '../data/db'
import {User} from '@gnothi/schemas/Users'
import {sql} from 'kysely'

// Typehint picks up a UUID, but cognito_id is stored as varchar (in case they
// change, since we have no control). un-hint it by not using kysley
async function fromCognito(cognitoId: string, justId=false) {
  const res = await raw(
    `select ${justId ? "id": "*"} from users where cognito_id=:cognito_id`,
    [
      {name: "cognito_id", value: {stringValue: cognitoId}}
    ]
  )
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
      await DB.insertInto('ws_connections')
        .values({user_id: user.id, connection_id})
        .execute()
      // await raw(
      //   `insert into ws_connections (user_id, connection_id) values (:0, :1)`,
      //   [
      //     {name: "0", value: {stringValue: user_id}, typeHint: "UUID"},
      //     {name: "1", value: {stringValue: connection_id}}
      //   ]
      // )
      return handled
    } else if (routeKey === "$disconnect") {
      await DB.deleteFrom("ws_connections")
        .where("connection_id", "=", connection_id)
        .execute()
      return handled
    }
  }

  const users = await raw(`
    select * from users
    inner join ws_connections on users.id=ws_connections.user_id
    where ws_connections.connection_id=:connection_id;
  `,
    [{name: "connection_id", value: {stringValue: connection_id}}]
  )
  const user = users[0] as User
  return {handled: false, user}
}
