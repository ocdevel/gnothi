import * as entries from './entries'
import * as users from './users'
import * as tags from './tags'
import * as fields from './fields'
import * as habitica from './fields/habitica'
import * as groups from './groups'
import * as notifs from './notifs'
import * as shares from './shares'
import * as insights from './insights'
import * as notes from './notes'
import * as stripe from './stripe'
import * as admin from './admin'

export default {
  ...entries,
  ...users,
  ...tags,
  ...fields,
  ...habitica,
  ...groups,
  ...notifs,
  ...shares,
  ...insights,
  ...notes,
  ...stripe,
  ...admin
}
