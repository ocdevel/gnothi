import z from 'zod'
import {User} from '../../data/schemas'
import {Route} from '../types'

export const Input = User.pick({
  email: true,
  cognito_id: true,
  username: true
})
export const Output = User.pick({id: true})

type Input = z.infer<typeof Input>
type Output = z.infer<typeof Output>

export const route: Route<Input,Output> = async (input, context) => {
  if (process.env.NODE_ENV === "production") {
    throw 404 // this will be handled via Cognito. Just used for dev/test
  }
  const result = await context.db.insert("users", input)
  return result
}
