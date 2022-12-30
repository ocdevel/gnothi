import {Entry} from '@gnothi/schemas/entries'
import {lambdaSend} from "../../aws/handlers";
import {Config} from '@serverless-stack/node/config'

type FnIn = {
  entry: Entry
}
type LambdaIn = {
  event: "upsert"
  data: FnIn
}
type LambdaOut = {
  title: string
  summary: string
  emotion: string
  keywords: string[]
}
type FnOut = LambdaOut
export async function upsert(data: FnIn): Promise<FnOut>{
  const fnName = Config.fn_store_name
  // 235b18c0f0163c9d5c30c429d6301be27cb00300 - manual entry into weaviate
  const res = await lambdaSend<LambdaOut>(
    {
      event: "upsert",
      data
    },
    fnName,
    "RequestResponse"
  )
  return res.Payload
}
