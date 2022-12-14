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
  const res = await lambdaSend<LambdaOut>(
    {
      event: "upsert",
      data: entry
    },
    process.env.fn_store,
    "RequestResponse"
  )
  return res.Payload
}
