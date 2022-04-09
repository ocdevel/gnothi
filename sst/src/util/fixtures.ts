import {z} from 'zod'
import * as s from '../data/schemas'

const userPartial = s.User.partial()
type User = z.infer<typeof userPartial>
export const users: Record<string, User> = {
  me: {
    email: 'me@x.com',
    cognito_id: 'me',
    username: 'me',
  },
  friend: {
    email: 'friend@x.com',
    cognito_id: 'friend',
    username: 'friend',
  },
  stranger: {
    email: 'stranger@x.com',
    cognito_id: 'stranger',
    username: 'stranger',
  }
}
