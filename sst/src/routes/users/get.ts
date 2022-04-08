import z from 'zod'
import {Route} from "../types"
import {User} from '../../data/schemas'

export const Input = User
export const Output = User
type Input = z.infer<typeof Input>
type Output = z.infer<typeof Output>

export const route: Route<Input, Output> = async (input, context) => {
  return await context.db.execute("select * from users where id=:id", {
    id: input.id
  })
}
