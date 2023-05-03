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
import {User, users} from '../data/schemas/users'
import {wsConnections} from "../data/schemas/wsConnections";
import {sql} from "drizzle-orm/sql"
import {eq} from "drizzle-orm/expressions"
import {FnContext} from "../routes/types";
import {DB} from "../data/db";

async function getFromCognito(db: DB, cognito_id: string): Promise<User> {
  const res = await db.drizzle.select()
    .from(users)
    .where(eq(users.cognito_id, cognito_id))
  return res[0]
}

type GetUser = {
  handled: boolean
  user?: User
}

export async function getUser(
  event: APIGatewayProxyWebsocketEventV2WithRequestContext<any>,
  context: Context,
  db: DB
) : Promise<GetUser> {
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
      const user = await getFromCognito(db, cognitoId)
      await db.query(sql`
        insert into ${wsConnections} (user_id, connection_id) 
        values (${user.id}, ${connection_id}) 
        on conflict do nothing
      `)
      return handled
    } else if (routeKey === "$disconnect") {
      await db.query(
        sql`delete from ${wsConnections} where connection_id=${connection_id}`
      )
      return handled
    }
    const user = await db.queryFirst(sql`
      select u.*
      from ${users} u
      inner join ${wsConnections} wc on u.id = wc.user_id
      where wc.connection_id = ${connection_id};
    `)
    return {handled: false, user}
  }

  const user = await getFromCognito(db, cognitoId)
  return {handled: false, user}
}
