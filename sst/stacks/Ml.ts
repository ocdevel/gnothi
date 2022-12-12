import * as sst from "@serverless-stack/resources";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as efs from "aws-cdk-lib/aws-efs";
import * as ecr from "aws-cdk-lib/aws-ecr-assets";
import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs"
import * as iam from "aws-cdk-lib/aws-iam"
import logs from 'aws-cdk-lib/aws-logs'
import ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns'
import {ApplicationProtocol} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import {DockerImageAsset} from "aws-cdk-lib/aws-ecr-assets";

// Getting a cyclical deps error when I have these all as different stacks, per
// sst recommended usage. Just calling them as functions for now
// https://gist.github.com/lefnire/4018a96ddee49d10b9a96c42b5698820

type AccessPoint = {
  fs: efs.FileSystem,
  id: string,
  path: string
}
function efsAccessPoint({fs, id, path}: AccessPoint) {
  return fs.addAccessPoint(id, {
    createAcl: {
      ownerGid: '1001',
      ownerUid: '1001',
      permissions: '750'
    },
    path: `/export/${path}`,
    posixUser: {
      gid: '1001',
      uid: '1001'
    }
  })
}

function vpcAndEfs({stack}: sst.StackContext) {
  // We try to get away with as much serverless as possible, but some resources
  // need ot run more traditionally. For this, have a universal VPC the different resources
  // can communicate behind

  // Private subnet setup: https://adrianhesketh.com/2022/05/31/create-vpc-with-cdk/,
  // https://bobbyhadz.com/blog/aws-cdk-vpc-example
  const vpc = new ec2.Vpc(stack, 'Vpc', {
    maxAzs: 2, // Default is all AZs in the region
    natGateways: 1,
    // enableDnsSupport: true,
    // enableDnsHostnames: true,
    // subnetConfiguration: [
    //   {
    //     name: "isolated-subnet-1",
    //     subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    //     cidrMask: 28,
    //   },
    // ]
  })

  // creates a file system in EFS to store cache models, weaviate data, etc
  const fs = new efs.FileSystem(stack, 'Efs', {
    vpc,
    removalPolicy: cdk.RemovalPolicy.DESTROY
  });

  return {vpc, fs}
}

type MLService = {
  context: sst.StackContext,
  vpc: ec2.Vpc,
  fs: efs.FileSystem,
}

function lambdas({context: {app, stack}, vpc, fs}: MLService) {
  // Our ML functions need HF models (large files) cached. Two options:
  // 1. Save HF model into docker image (see git-lfs sample)
  // 2. Save HF models in EFS mount, cache folder
  // - https://aws.amazon.com/blogs/compute/hosting-hugging-face-models-on-aws-lambda/
  // - https://github.com/cdk-patterns/serverless/blob/main/the-efs-lambda/typescript/lib/the-efs-lambda-stack.ts
  // Going with option 2 to save on lambda-start & CDK deployment times

  const accessPoint = efsAccessPoint({
    fs,
    id: "LambdaAccessPoint",
    path: "mldata"
  })

  const mlFunctionProps = {
    // we need only about 4-6gb RAM; but we need the CPU power given by higher ram:
    // https://stackoverflow.com/a/66523153
    memorySize: 8846,
    timeout: cdk.Duration.minutes(10),
    vpc,
    filesystem: lambda.FileSystem.fromEfsAccessPoint(accessPoint, '/mnt/mldata')
  } as const

  const fnSummarize = new lambda.DockerImageFunction(stack, "fn_summarize", {
    ...mlFunctionProps,
    code: lambda.DockerImageCode.fromImageAsset("ml", {
      file: "summarize.dockerfile"
    }),
  })
  const fnSearch = new lambda.DockerImageFunction(stack, "fn_search", {
    ...mlFunctionProps,
    code: lambda.DockerImageCode.fromImageAsset("ml", {
      file: "docstore.dockerfile"
    }),
  })
  fnSummarize.grantInvoke(fnSearch)

  stack.addOutputs({
    fnSearch_: fnSearch.functionArn,
    fnSummarize_: fnSummarize.functionArn,
  })
  return {fnSearch, fnSummarize}
}

export function Ml(context: sst.StackContext) {
  const { app, stack } = context

  const {vpc, fs} = vpcAndEfs(context)
  const {fnSearch, fnSummarize} = lambdas({context, vpc, fs})

  return {
    fnSearch,
    fnSummarize,
  }
}
