import * as sst from "sst/constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as efs from "aws-cdk-lib/aws-efs";
import * as cdk from "aws-cdk-lib";
import {rams} from "./util";
import {SharedImport} from "./Shared";
import {Misc} from "./Misc";

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

type MLService = {
  context: sst.StackContext,
  vpc: ec2.IVpc,
  fs: efs.FileSystem,
  bucket: sst.Bucket
}

function lambdas({context, vpc, fs, bucket}: MLService) {
  // Our ML functions need HF models (large files) cached. Two options:
  // 1. Save HF model into docker image (see git-lfs sample)
  // 2. Save HF models in EFS mount, cache folder
  // - https://aws.amazon.com/blogs/compute/hosting-hugging-face-models-on-aws-lambda/
  // - https://github.com/cdk-patterns/serverless/blob/main/the-efs-lambda/typescript/lib/the-efs-lambda-stack.ts
  // Going with option 2 to save on lambda-start & CDK deployment times

  const {app, stack} = context

  const openAiKey = new sst.Config.Secret(stack, "openai_key")

  const accessPoint = efsAccessPoint({
    fs,
    id: "LambdaAccessPoint",
    path: "mldata"
  })

  const mlFunctionProps = {
    memorySize: rams.ai,
    timeout: cdk.Duration.minutes(5),
    vpc,
    filesystem: lambda.FileSystem.fromEfsAccessPoint(accessPoint, '/mnt/mldata'),
    environment: {
      region: app.region,
      bucket_name: bucket.bucketName
    }
  } as const

  const fnPreprocess = new lambda.DockerImageFunction(stack, "fn_preprocess", {
    ...mlFunctionProps,
    memorySize: 512,
    timeout: cdk.Duration.minutes(3),
    code: lambda.DockerImageCode.fromImageAsset("services/ml/python", {
      file: "preprocess.dockerfile"
    }),
  })
  const fnBooks = new lambda.DockerImageFunction(stack, "fn_books", {
    ...mlFunctionProps,
    memorySize: 4459,
    // TODO This one can take forever on initial download of feather to EFS. For that reason I'm upping
    // it to 15 minutes for fail-safe on the first run, but this should be mitigated then lowered later.
    timeout: cdk.Duration.minutes(15),
    code: lambda.DockerImageCode.fromImageAsset("services/ml/python", {
      file: "books.dockerfile"
    }),
  })
  const fnAsk = new lambda.DockerImageFunction(stack, "fn_ask", {
    ...mlFunctionProps,
    // see utils.ts for how to determine optimal MB
    memorySize: 3446,
    code: lambda.DockerImageCode.fromImageAsset("services/ml/python", {
      file: "ask.dockerfile"
    }),
  })
  const fnSummarize = new lambda.DockerImageFunction(stack, "fn_summarize", {
    ...mlFunctionProps,
    memorySize: 4357,
    // TODO figure out why so long
    timeout: cdk.Duration.minutes(15),
    code: lambda.DockerImageCode.fromImageAsset("services/ml/python", {
      file: "summarize.dockerfile"
    }),
  })
  const fnStore = new lambda.DockerImageFunction(stack, "fn_store", {
    ...mlFunctionProps,
    memorySize: 1107,
    timeout: cdk.Duration.minutes(15),
    code: lambda.DockerImageCode.fromImageAsset("services/ml/python", {
      file: "store.dockerfile"
    }),
  })
  fnSummarize.grantInvoke(fnStore)

  // Let the functions read/write to the ML bucket
  bucket.cdk.bucket.grantReadWrite(fnBooks)
  bucket.cdk.bucket.grantReadWrite(fnAsk)
  bucket.cdk.bucket.grantReadWrite(fnStore)

  stack.addOutputs({
    fnBooks_: fnBooks.functionArn,
    fnAsk_: fnAsk.functionArn,
    fnSummarize_: fnSummarize.functionArn,
    fnStore_: fnStore.functionArn,
    fnPreprocess_: fnPreprocess.functionArn,
  })
  return {fnBooks, fnAsk, fnSummarize, fnStore, fnPreprocess, openAiKey}
}

export function Ml(context: sst.StackContext) {
  const { app, stack } = context
  const {vpc} = sst.use(SharedImport);

  // Will put some assets in here like books.feather, and may move some EFS
  // use-cases towards S3 + PyArrow
  const {bucket} = sst.use(Misc)

  // creates a file system in EFS to store cache models, weaviate data, etc
  const fs = new efs.FileSystem(stack, 'Efs', {
    vpc,
    removalPolicy: cdk.RemovalPolicy.DESTROY
  });

  const fns = lambdas({
    context,
    vpc,
    fs,
    bucket
  })

  return fns
}
