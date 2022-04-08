import * as s from './schemas'
import {DB} from './db'
import * as schemas from "./schemas";

class Base {
  #table: string = ''
}

export class User {
  schema  = s.User
  #table = 'users'
}

export class WsConnection {
  static readonly schema = s.WsConnection
  static readonly table = 'ws_connections'

  static async connect(
    db: DB,
    user_id: s.WsConnection["user_id"],
    connection_id: s.WsConnection["connection_id"] ,
  ) {
    await db.execute({
      sql: `INSERT INTO ${this.table} (user_id, connection_id) VALUES (:user_id, :connection_id)`,
      values: {user_id, connection_id}
    }, {input: this.schema})
  }

  static async disconnect(
    db: DB,
    connection_id: s.WsConnection["connection_id"] ,
  ) {
    await db.execute({
      sql: `DELETE FROM ${this.table} WHERE connection_id=:connection_id`,
      values: {connection_id}
    }, {input: this.schema})
  }
}
