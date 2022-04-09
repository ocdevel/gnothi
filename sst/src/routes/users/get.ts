import z from 'zod'
import {Route} from "../types"
import {User} from '../../data/schemas'

export const Input = z.object({
  id: z.string().uuid()
})
type Input = z.infer<typeof Input>

export const Output = User
type Output = z.infer<typeof Output>

export const route: Route<Input, Output> = async (input, context) => {
  return await context.db.execute({
    sql: "select * from users where id=:id",
    values: {id: input.id}
  }, {input: Input, output: Output})
}
