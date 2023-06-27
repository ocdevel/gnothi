import * as sst from "sst/constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as efs from "aws-cdk-lib/aws-efs";
import * as aws_events from "aws-cdk-lib/aws-events"
import * as aws_targets from  "aws-cdk-lib/aws-events-targets"
import * as cdk from "aws-cdk-lib";
import {rams} from "./util";
import {SharedImport} from "./Shared";
import {Misc} from "./Misc";
import {Logs} from "./Logs";

// Getting a cyclical deps error when I have these all as different stacks, per
// sst recommended usage. Just calling them as functions for now
// https://gist.github.com/lefnire/4018a96ddee49d10b9a96c42b5698820

export function Ml(context: sst.StackContext) {
  const { app, stack } = context
  const {vpc, readSecretPolicy, rdsSecret} = sst.use(SharedImport);
  const {addLogging} = sst.use(Logs)

  // Will put some assets in here like books.feather, and may move some EFS
  // use-cases towards S3 + PyArrow
  const {bucket} = sst.use(Misc)

  // creates a file system in EFS to store cache models, weaviate data, etc
  const fs = new efs.FileSystem(stack, 'Efs', {
    vpc,
    removalPolicy: cdk.RemovalPolicy.DESTROY
  });


  // Our ML functions need HF models (large files) cached. Two options:
  // 1. Save HF model into docker image (see git-lfs sample)
  // 2. Save HF models in EFS mount, cache folder
  // - https://aws.amazon.com/blogs/compute/hosting-hugging-face-models-on-aws-lambda/
  // - https://github.com/cdk-patterns/serverless/blob/main/the-efs-lambda/typescript/lib/the-efs-lambda-stack.ts
  // Going with option 2 to save on lambda-start & CDK deployment times
  const OPENAI_KEY = new sst.Config.Secret(stack, "OPENAI_KEY")

  const accessPoint = fs.addAccessPoint("LambdaAccessPoint", {
    createAcl: {
      ownerGid: '1001',
      ownerUid: '1001',
      permissions: '750'
    },
    path: `/export/mldata`,
    posixUser: {
      gid: '1001',
      uid: '1001'
    }
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

  const fnPreprocess = new lambda.DockerImageFunction(stack, "FnPreprocess", {
    ...mlFunctionProps,
    memorySize: 512,
    timeout: cdk.Duration.minutes(3),
    code: lambda.DockerImageCode.fromImageAsset("services/ml/python", {
      file: "preprocess.dockerfile"
    }),
  })
  const fnBooks = new lambda.DockerImageFunction(stack, "FnBooks", {
    ...mlFunctionProps,
    memorySize: 4459,
    // TODO This one can take forever on initial download of feather to EFS. For that reason I'm upping
    // it to 15 minutes for fail-safe on the first run, but this should be mitigated then lowered later.
    timeout: cdk.Duration.minutes(15),
    code: lambda.DockerImageCode.fromImageAsset("services/ml/python", {
      file: "books.dockerfile"
    }),
  })
  const fnAsk = new lambda.DockerImageFunction(stack, "FnAsk", {
    ...mlFunctionProps,
    // see utils.ts for how to determine optimal MB
    memorySize: 3446,
    code: lambda.DockerImageCode.fromImageAsset("services/ml/python", {
      file: "ask.dockerfile"
    }),
  })
  const fnSummarize = new lambda.DockerImageFunction(stack, "FnSummarize", {
    ...mlFunctionProps,
    memorySize: 4357,
    // TODO figure out why so long
    timeout: cdk.Duration.minutes(15),
    code: lambda.DockerImageCode.fromImageAsset("services/ml/python", {
      file: "summarize.dockerfile"
    }),
  })
  const fnStore = new lambda.DockerImageFunction(stack, "FnStore", {
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


  // TODO this function should remove access to RDS, and instead interact with the app server via S3
  const fnBehaviors = new lambda.DockerImageFunction(stack, "FnBehaviors", {
    ...mlFunctionProps,
    environment: {
      SST_STAGE: app.stage,
      DB_SECRET_ARN: rdsSecret.secretArn,
    },
    // 310mb used avg. I don't think it's RAM heavy, but CPU. Doubling for good
    // measure, but keep an eye - I worry this is too low.
    // memorySize: 620,

    // TODO separate Influencers from TableQA. Influencers only needs 620mb RAM, TableQA needs much more
    memorySize: 3283,
    timeout: cdk.Duration.minutes(15),
    code: lambda.DockerImageCode.fromImageAsset("services/ml/python", {
      file: "behaviors.dockerfile"
    }),
  })
  fnBehaviors.addToRolePolicy(readSecretPolicy)
  // sst.Cron only works with ss.Function, manually creating my own cron here
  if (app.stage === "prod") {
    const behaviorsRule = new aws_events.Rule(this, 'CronBehaviors', {
      schedule: aws_events.Schedule.rate(cdk.Duration.hours(1)),
    });
    behaviorsRule.addTarget(new aws_targets.LambdaFunction(fnBehaviors));
  }

  addLogging(fnPreprocess, "FnPreprocess")
  addLogging(fnBooks, "FnBooks")
  addLogging(fnAsk, "FnAsk")
  addLogging(fnSummarize, "FnSummarize")
  addLogging(fnStore, "FnStore")
  addLogging(fnBehaviors, "FnBehaviors")

  stack.addOutputs({
    fnBooks_: fnBooks.functionName,
    fnAsk_: fnAsk.functionName,
    fnSummarize_: fnSummarize.functionName,
    fnStore_: fnStore.functionName,
    fnPreprocess_: fnPreprocess.functionName,
    fnBehaviors_: fnBehaviors.functionName,
  })

  return {OPENAI_KEY, fnPreprocess, fnBooks, fnAsk, fnSummarize, fnStore, fnBehaviors}
}
