import {Users} from './users'
import {Tags} from './tags'
import {Entries} from './entries'
import {Fields} from './fields'
import {Groups} from './groups'
import {Shares} from './shares'
import {Notifs} from './notifs'
import {Ws} from './ws'
import {Auth} from './auth'
import {Analyze} from './analyze'

export * as Routes from './routes'

export const routes = {
  ...Users.routes,
  ...Tags.routes,
  ...Entries.routes,
  ...Fields.routes,
  ...Groups.routes,
  ...Shares.routes,
  ...Notifs.routes,
  ...Ws.routes,
  ...Auth.routes,
  ...Analyze.routes
}
