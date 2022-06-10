import {User} from "../data/schemas";
import {DB} from '../data/db'

export type Context = {
  user: User | null,
  snoop?: string,
  db: DB
}

export type Route<T, U> = (input: T, context: Context) => Promise<U>