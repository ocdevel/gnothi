import {z} from "zod";
import {User} from "data/schemas";
import {DB} from 'data/db'
import {CantSnoop} from "./errors";

export type AnonContext = {
  db: DB
}

export type AuthContext = {
  user: User
  snoop?: string
  db: DB
}

export default function route<
  I extends z.ZodTypeAny,
  O extends z.ZodTypeAny,
>(
  fn: (parsedBody: z.TypeOf<I>, context: AuthContext) => Promise<z.TypeOf<O>>,
  {zIn, zOut, cantSnoop}: {zIn: I, zOut: O, cantSnoop?: boolean}
) {
  return async function (rawBody: I, context: AuthContext): Promise<O> {
    // TODO test if context.user.id === ??.id (consistent id in all requests?)
    // if (cantSnoop && body.userId !== context.userId) {
    //   const msg = typeof cantSnoop === "string" ? cantSnoop
    //     : "Can't snoop this resource"
    //   throw new CantSnoop(msg)
    // }
    const parsed = zIn.parse(rawBody)
    const rawOutput = await fn(parsed, context)
    return zOut.parse(rawOutput)
  }
}
