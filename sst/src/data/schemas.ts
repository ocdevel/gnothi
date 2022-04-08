import {z} from 'zod'

export const RouteBody = z.object({
  route: z.string().regex(/[a-z\-/]+/),
  method: z.enum(["GET", "PUT", "POST", "PATCH", "DELETE"]),
  body: z.any().default({})
})
export type RouteBody = z.infer<typeof RouteBody>

export const User = z.object({
  id: z.string().uuid(),
  email: z.string().email()
})
export type User = z.infer<typeof User>

export const WsConnection = z.object({
  connection_id: z.string(),
  user_id: User.shape.id
})
export type WsConnection = z.infer<typeof WsConnection>


