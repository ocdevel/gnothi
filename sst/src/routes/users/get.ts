import z from 'zod'
import {Route} from "../types"
import {User} from '../../data/schemas'
import {CantSnoop} from "../errors";

export const cantSnoop = true
export const Input = z.object({
  id: z.string().uuid()
})
type Input = z.infer<typeof Input>

export const Output = User
type Output = z.infer<typeof Output>

export const route: Route<Input, Output> = async (input, context) => {
  if (context.user.id !== input.id) {
    throw new CantSnoop()
  }
  return await context.db.execute({
    sql: "select * from users where id=:id",
    values: {id: input.id}
  }, {input: Input, output: Output})
}
