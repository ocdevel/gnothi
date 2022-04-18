import {z} from 'zod'
import * as users from './users'
import {RouteBody} from '../data/schemas'
import {Context} from './types'
import {CantSnoop} from './errors'

const routes = {
  router: {
    users
  }
}

interface RouteDef {
  Input: z.AnyZodObject,
  Output: z.AnyZodObject,
  cantSnoop?: boolean,
  route: (data: any, context: Context) => Promise<any>
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

export default async function router(body: RouteBody, context: Context) {
  const validated = RouteBody.parse(body)
  const {route, method} = validated
  const parts = route.split('/').filter(k => k !== "").map(k => k.toLowerCase())
  const routeDef: RouteDef = findRoute(parts, method.toLowerCase(), routes)
  // TODO test if context.user.id === ??.id (consistent id in all requests?)
  // if (routeDef.cantSnoop) {
  //   const msg = typeof routeDef.cantSnoop === "string" ? routeDef.cantSnoop
  //     : "Can't snoop this resource"
  //   throw new CantSnoop(msg)
  // }
  const input = routeDef.Input.parse(body.body || {})
  const result = await routeDef.route(input, context)
  return result.map((r: any) => routeDef.Output.parse(r))
}
