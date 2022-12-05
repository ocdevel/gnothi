import * as sst from "@serverless-stack/resources";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {Duration} from "aws-cdk-lib";
import path from 'path'

export function Ml({ app, stack }: sst.StackContext) {
  const mlFunctionProps: sst.FunctionProps = {
    srcPath: "services",
    runtime: "python3.9",
    timeout: "10 minutes", // definitely needed for ML functions
  }

  const fnSummarize = new lambda.DockerImageFunction(stack, "fn_summarize", {
    code: lambda.DockerImageCode.fromImageAsset("services/ml/summarize"),
    memorySize: 10240,
    timeout: Duration.minutes(10)
  })
  const fnKeywords = new lambda.DockerImageFunction(stack, "fn_keywords", {
    code: lambda.DockerImageCode.fromImageAsset("services/ml/keywords"),
    memorySize: 10240,
    timeout: Duration.minutes(10)
  })

  const fnSearch = new sst.Function(stack, "fn_search", {
    ...mlFunctionProps,
    handler: "ml/search.main"
  })
  stack.addOutputs({
    fnSearch_: fnSearch.functionArn,
    fnSummarize_: fnSummarize.functionArn,
    fnKeywords_: fnKeywords.functionArn,
  })
  return {
    fnSearch,
    fnSummarize,
    fnKeywords
  }
}
