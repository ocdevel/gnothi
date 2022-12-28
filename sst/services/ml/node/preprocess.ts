import {lambdaSend} from "../../aws/handlers"
import {Config} from '@serverless-stack/node/config'
const fnName = Config.fn_preprocess_name

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
  const res = await lambdaSend<LambdaOut>(data, fnName, "RequestResponse")
  return res.Payload
}
