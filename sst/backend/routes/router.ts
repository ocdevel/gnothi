import {z} from 'zod'
import * as users from 'routes/users'
import {AuthContext, RouteDef} from 'routes/route'
import {CantSnoop} from './errors'

export const RouteData = z.object({
  route: z.string().regex(/[a-z\-/]+/),
  method: z.enum(["GET", "PUT", "POST", "PATCH", "DELETE"]),
  body: z.any().default({})
})
export type RouteData = z.infer<typeof RouteData>

const routes = {
  router: {
    users
  }
}

function findRoute(parts: string[], method: string, curr: any): any {
  const childRouter = curr.router?.[parts[0]]
  if (childRouter) {
    return findRoute(parts.slice(1), method, childRouter)
  }
  const route = curr.router?.[method]
  if (route) { return route }
  throw 404
}

export default async function router(data: RouteData, context: AuthContext) {
  const {route, method, body} = RouteData.parse(data)
  const parts = route.split('/').filter(k => k !== "").map(k => k.toLowerCase())
  const routeDef: RouteDef = findRoute(parts, method.toLowerCase(), routes)
  return await routeDef.route(body, context)
}
