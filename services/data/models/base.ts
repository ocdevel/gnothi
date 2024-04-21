import {sql} from "drizzle-orm"
import {Users} from './users'
import {users, User} from '../schemas/users'
import {FnContext} from "../../routes/types";
import {DB} from '../db'
import dayjs from "dayjs"

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
    const day_ = this.justDay(day);
    return sql`(
      COALESCE(
        ${day_}::TIMESTAMP AT TIME ZONE with_tz.tz, 
        NOW() AT TIME ZONE with_tz.tz
      ) 
    )`
  }
  tz_write(day?: string | Date) {
    const day_ = this.justDay(day)
    return sql`(
      COALESCE(
        ${day_}::TIMESTAMP AT TIME ZONE with_tz.tz, 
        NOW()
      )
    )`
  }

  justDay(day?: string | Date) {
    // For SQL, it wants literally null, not undefined, so convert both cases to null
    if (!day) { return null }

    // This is what's expected, work with it.
    if (typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
      return day
    }
    // We got a date. Not ideal, since we're expecting day-formatted strings with tz_read & tz_write; but
    // let's try to make it work.
    // drizzle-orm 0.30.0 changed handling of {mode: 'string'|'date'} to date columns. This is a hot-fix to just
    // field-entries, and I need to investigate any other changes needed
    return dayjs(day).format("YYYY-MM-DD")
  }

  constructor(context: FnContext) {
    this.context = context
  }
}
