import z, {string} from 'zod'
import route from "routes/route"
import {User} from 'data/schemas'
import {CantSnoop} from "routes/errors";

export const cantSnoop = true

export const Input = User.pick({
  id: true
})
export type Input = z.infer<typeof Input>

export const Output = User.array()
export type Output = z.infer<typeof Output>

export default route(async (body, {user, db}) => {
  if (user.id !== body.id) {
    throw new CantSnoop()
  }
  return await db.execute({
    sql: "select * from users where id=:id",
    values: {id: body.id},
    zIn: Input, zOut: Output
  })
}, {
  zIn: Input,
  zOut: Output,
  cantSnoop: true
})
