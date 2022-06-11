import {User} from "data/schemas";
import {DB} from 'data/db'

export type AnonContext = {
  db: DB
}

export type AuthContext = {
  user: User
  snoop?: string
  db: DB
}

export type AnonRoute<T, U> = (input: T, context: AnonContext) => Promise<U>
export type AuthRoute<T, U> = (input: T, context: AuthContext) => Promise<U>
