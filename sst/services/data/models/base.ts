import {sql} from "drizzle-orm/sql"
import {Users} from './users'
import {users, User} from '../schemas/users'
import {FnContext} from "../../routes/types";
import {DB} from '../db'

export class Base {
  context: FnContext

  // NOTE!! Wherever this is used, make sure the $param order is respected
  with_tz() {
    return sql`with with_tz as (
      select id, coalesce(timezone, 'America/Los_Angeles') as tz
      from ${users} where id=${this.context.vid}
    )`
  }
  at_tz = sql`at time zone with_tz.tz`
  // tz_read = `coalesce(:day ::timestamp ${this.at_tz}, now() ${this.at_tz})`
  // tz_write = `coalesce(:day ::timestamp ${this.at_tz}, now())`
  tz_read(day: string | Date) {
    return sql`coalesce(${day || null} ::timestamp at time zone with_tz.tz, now() at time zone with_tz.tz)`
  }
  tz_write(day: string | Date | undefined) {
    return sql`coalesce(${day || null} ::timestamp at time zone with_tz.tz, now())`
  }

  constructor(context: FnContext) {
    this.context = context
  }
}
