import z from 'zod'
import {User} from '../../data/schemas'
import {Route} from '../types'

export const Input = User
export const Output = User

type Input = z.infer<typeof Input>
type Output = z.infer<typeof Output>

export const route: Route<Input,Output> = async (input, context) => {
  if (process.env.NODE_ENV === "production") {
    throw 404 // this will be handled via Cognito. Just used for dev/test
  }
  const user = await context.db.execute("insert into users (id, email) values (:id, :email) returning *", input)
  return user
}
