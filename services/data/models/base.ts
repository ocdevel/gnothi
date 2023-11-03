import {sql} from "drizzle-orm"
import {Users} from './users'
import {users, User} from '../schemas/users'
import {FnContext} from "../../routes/types";
import {DB} from '../db'

// In case a date was sent as a string like '2023-04-24T04:30:29.213Z', manually convert it (TODO use dayjs)
function getDateInTimezone(dateString, timezone) {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: timezone,
  });

  const formattedDate = formatter.format(date);
  const [month, day, year] = formattedDate.split('/');
  return `${year}-${month}-${day}`;
}

export class Base {
  context: FnContext

  // NOTE!! Wherever this is used, make sure the $param order is respected
  with_tz() {
    return sql`WITH with_tz AS (
      SELECT id, COALESCE(timezone, 'America/Los_Angeles') AS tz
      FROM users WHERE id=${this.context.vid}
    )`
  }
  at_tz = sql`at time zone with_tz.tz`
  // tz_read = `coalesce(:day ::timestamp ${this.at_tz}, now() ${this.at_tz})`
  // tz_write = `coalesce(:day ::timestamp ${this.at_tz}, now())`
  tz_read(day: string | Date) {
    return sql`(
      COALESCE(
        ${day || null}::TIMESTAMP AT TIME ZONE with_tz.tz, 
        NOW() AT TIME ZONE with_tz.tz
      ) 
    )`
  }
  tz_write(day: string | Date | undefined) {
    return sql`(
      COALESCE(
        ${day || null}::TIMESTAMP AT TIME ZONE with_tz.tz, 
        NOW()
      )
    )`
  }

  constructor(context: FnContext) {
    this.context = context
  }
}
