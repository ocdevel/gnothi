import {Entry} from '@gnothi/schemas/entries'
import {lambdaSend} from "../../aws/handlers";

type FnIn = Entry
type LambdaIn = {
  event: "upsert"
  data: Entry
}
type LambdaOut = {
  title: string
  summary: string
  emotion: string
  keywords: string[]
}
type FnOut = LambdaOut
export async function upsert(entry: FnIn): Promise<FnOut>{
  // 235b18c0f0163c9d5c30c429d6301be27cb00300 - manual entry into weaviate

  const functionName = process.env.fn_search

  async function call(data: LambdaIn): Promise<LambdaOut> {
    const res = await lambdaSend<LambdaOut>(data, functionName, "RequestResponse")
    return res.Payload
  }

  return await call({
    event: "upsert",
    data: entry
  })
}
