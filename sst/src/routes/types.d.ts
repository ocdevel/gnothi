import {User} from "../data/schemas";

export type Context = {
  user?: User
  db?: any
}

export type Route<T, U> = (input: T, context: Context) => Promise<U>
