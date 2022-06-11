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

const Schema = z.object({a: z.number()})
function parse<I extends z.ZodTypeAny>(schema: I, data: any): z.TypeOf<I> {
  return schema.parse(data)
}
const parsed = parse(Schema, {a: 1})

function onParsed<I extends z.ZodTypeAny>(schema: z.AnyZodObject, data: z.TypeOf<I>) {
  return [schema.shape, parsed.a]
}
const [shape, a] = onParsed(Schema, parsed)
