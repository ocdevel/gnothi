import {DB} from "../data";

export async function connect(db: DB, connectionId: string, userId: string): Promise<string> {
  await db.execute({
    sql: "INSERT INTO ws_connections (user_id, connection_id) VALUES (:user_id::uuid, :connection_id)",
    parameters: [
      {name: 'user_id', value: {stringValue: userId}},
      {name: 'connection_id', value: {stringValue: connectionId}}
    ]
  })
  return `${connectionId} connected`
}

export async function disconnect(db: DB, connectionId: string): Promise<string> {
  await db.execute({
    sql: "DELETE FROM ws_connections WHERE connection_id=:connection_id",
    parameters: [
      {name:'connection_id', value: {stringValue: connectionId}}
    ]
  })
  return `${connectionId} disconnected`
}
