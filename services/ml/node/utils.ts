import {z} from 'zod'
import {DefO, FnContext} from '@gnothi/schemas/api'

export async function sendInsight<T extends z.ZodTypeAny, Route extends DefO<T>>(
  route: Route,
  obj: Route['s'],
  context: FnContext
) {
  if (!context?.connectionId) { return }
  const row = [{
    view: context.requestId,
    ...obj
  }]
  await context.handleRes(
    route,
    {data: row},
    context
  )
}
