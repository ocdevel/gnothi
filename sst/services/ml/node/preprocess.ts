import {lambdaSend} from "../../aws/handlers"

interface FnIn {
  text: string
  method: 'md2txt'
}
type LambdaIn = FnIn
type LambdaOut = {
  text: string
  paras: string[]
}
type FnOut = LambdaOut
export async function preprocess(data: FnIn): Promise<FnOut> {
  const functionName = process.env.fn_preprocess

  const res = await lambdaSend<LambdaOut>(data, functionName, "RequestResponse")
  return res.Payload
}
