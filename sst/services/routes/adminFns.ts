import {db}  from '../data/dbSingleton'
import {DB} from '../data/db'
import {eq} from 'drizzle-orm'
import {users} from '../data/schemas/users'
import _ from 'lodash'

export async function main(event, context) {
  let body = '{"message": "no changes"}'
  if (event.event === 'users_update') {
    const {email, ...rest} = event.data
    const validUpdates = DB.removeUndefined(_.pick(rest, ['premium', 'is_cool', 'is_superuser']))
    const updated = await db.drizzle.update(users).set(validUpdates).where(eq(users.email, email)).returning()
    body = JSON.stringify(updated)
  }
  return {
    statusCode: 200,
    body
  }

}
