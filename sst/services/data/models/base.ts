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
    return sql`with with_tz as (
      select id, coalesce(${users.timezone}, 'America/Los_Angeles') as tz
      from ${users} where id=${this.context.vid}
    )`
  }
  at_tz = sql`at time zone with_tz.tz`
  // tz_read = `coalesce(:day ::timestamp ${this.at_tz}, now() ${this.at_tz})`
  // tz_write = `coalesce(:day ::timestamp ${this.at_tz}, now())`
  tz_read(day: string | Date) {
    console.log({tz_read_day: day})
    return sql`coalesce(${day || null}::timestamp at time zone with_tz.tz, now() at time zone with_tz.tz)`
  }
  tz_write(day: string | Date | undefined) {
    console.log({tz_read_day: day})
    return sql`coalesce(${day || null}, now())`
  }

  constructor(context: FnContext) {
    this.context = context
  }
}
