import {sql} from "drizzle-orm/sql"
export class Base {
  uid: string
  vid: string | undefined
  snooping: boolean

  // NOTE!! Wherever this is used, make sure the $param order is respected
  with_tz(user_id: string) {
    return sql`with with_tz as (
      select id, coalesce(timezone, 'America/Los_Angeles') as tz
      from users where id=${user_id}
    )`
  }
  at_tz = "at time zone with_tz.tz"
  // tz_read = `coalesce(:day ::timestamp ${this.at_tz}, now() ${this.at_tz})`
  // tz_write = `coalesce(:day ::timestamp ${this.at_tz}, now())`
  tz_read(day: string | Date) {
    return sql`coalesce(${day || null} ::timestamp ${this.at_tz}, now() ${this.at_tz})`
  }
  tz_write(day: string | Date | undefined) {
    return sql`coalesce(${day || null} ::timestamp ${this.at_tz}, now())`
  }

  constructor(uid: string, vid?: string) {
    this.uid = uid
    this.vid = vid
    this.snooping = vid && vid !== uid
  }
}
