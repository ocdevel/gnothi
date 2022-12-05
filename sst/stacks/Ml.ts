import * as sst from "@serverless-stack/resources";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as efs from "aws-cdk-lib/aws-efs";
import * as ecr from "aws-cdk-lib/aws-ecr-assets";
import * as cdk from "aws-cdk-lib";
import path from 'path'

export function Ml({ app, stack }: sst.StackContext) {
  // Two options:
  // 1. Save HF model into docker image (see commented out sections in Dockerfiles)
  // 2. Save HF models in EFS mount, cache folder
  // - https://aws.amazon.com/blogs/compute/hosting-hugging-face-models-on-aws-lambda/
  // - https://github.com/cdk-patterns/serverless/blob/main/the-efs-lambda/typescript/lib/the-efs-lambda-stack.ts
  // Going with option 2 to save on lambda-start & CDK deployment times

  //EFS needs to be setup in a VPC
  const vpc = new ec2.Vpc(stack, 'MlVpc', {
    maxAzs: 2, // Default is all AZs in the region
  });

  // creates a file system in EFS to store cache models
  const fs = new efs.FileSystem(stack, 'FileSystem', {
    vpc,
    removalPolicy: cdk.RemovalPolicy.DESTROY
  });

  const accessPoint = fs.addAccessPoint('AccessPoint',{
    createAcl: {
      ownerGid: '1001',
      ownerUid: '1001',
      permissions: '750'
    },
    path:'/export/models',
    posixUser: {
      gid: '1001',
      uid: '1001'
    }
  })

  const mlFunctionProps = {
    // we need only about 4-6gb RAM; but we need the CPU power given by higher ram:
    // https://stackoverflow.com/a/66523153
    memorySize: 8846,
    timeout: cdk.Duration.minutes(10),
    vpc: vpc,
    filesystem: lambda.FileSystem.fromEfsAccessPoint(accessPoint, '/mnt/transformers_cache')
  } as const

  const fnSummarize = new lambda.DockerImageFunction(stack, "fn_summarize", {
    ...mlFunctionProps,
    code: lambda.DockerImageCode.fromImageAsset("services/ml/summarize"),
  })

  const fnSearch = new sst.Function(stack, "fn_search", {
    srcPath: "services",
    runtime: "python3.9",
    timeout: "10 minutes", // definitely needed for ML functions
    handler: "ml/search.main"
  })
  stack.addOutputs({
    fnSearch_: fnSearch.functionArn,
    fnSummarize_: fnSummarize.functionArn,
  })
  return {
    fnSearch,
    fnSummarize
  }
}
