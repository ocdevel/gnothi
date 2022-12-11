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

type WeaviateProps = MLService
function weaviate({context, vpc, fs}: WeaviateProps) {
  const {app, stack} = context
  /**
   * Weaviate
   * The weaviate docker-compose.yml file can be deployed direct to AWS, see
   * https://docs.docker.com/cloud/ecs-integration/
   * But I want it part of the CDK stack. Some resources on that:
   * - https://www.gravitywell.co.uk/insights/deploying-applications-to-ecs-fargate-with-aws-cdk/
   * - https://docs.amazonaws.cn/en_us/AmazonECS/latest/userguide/tutorial-ecs-web-server-cdk.html
   * - https://raw.githubusercontent.com/aws-samples/aws-cdk-examples/master/typescript/ecs/ecs-service-with-advanced-alb-config/index.ts
   * - https://docs.aws.amazon.com/cdk/v1/guide/ecs_example.html
   *
   * But this in particular was a great post, specifically about replicating docker-compose
   * context into CDK (what we want):
   * - https://blog.jeffbryner.com/2020/07/20/aws-cdk-docker-explorations.html
   * - https://github.com/jeffbryner/aws-cdk-example-deployment/blob/master/infrastructure/infrastructure.py
   *
   * Fargate with EFS:
   * - https://bliskavka.com/2021/10/21/AWS-CDK-Fargate-with-EFS/
   */

  const accessPoint = efsAccessPoint({
    fs,
    id: "WeaviateAccessPoint",
    path: "weaviate"
  })

  // CPU/RAM mappings at https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-cpu-memory-error.html
  // TODO distribute these more intelligently through the tasks/services, I don't want to think right now
  const resources = {
    cpu: 512, // Default is 256
    memoryLimitMiB: 2048 // Default is 512
  } as const

  const cluster = new ecs.Cluster(stack, "MlCluster", {vpc})

  // a4829616 - t2v-transformers module. Having trouble with CloudMapping connecting
  // the services, but I don't need the module anyway (using Haystack).

  const task = new ecs.FargateTaskDefinition(stack, "weaviate-task", {
    ...resources,
  })
  const container = task.addContainer("weaviate", {
    image: ecs.ContainerImage.fromRegistry("semitechnologies/weaviate:1.16.5"),
    essential: true,
    logging: ecs.LogDrivers.awsLogs({
      streamPrefix: "weaviateContainer",
      logRetention: logs.RetentionDays.ONE_WEEK,
    }),
    portMappings: [{containerPort:8080, hostPort: 8080}],
    environment: {
      QUERY_DEFAULTS_LIMIT: "25",
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true',
      PERSISTENCE_DATA_PATH: '/mnt/weaviate',
      DEFAULT_VECTORIZER_MODULE: 'none',
      ENABLE_MODULES: 'ref2vec-centroid',
      CLUSTER_HOSTNAME: 'node1'
    },
  })
  task.addVolume({
    name: "mntWeaviate",
    efsVolumeConfiguration: {
      fileSystemId: fs.fileSystemId,
      transitEncryption: 'ENABLED',
      authorizationConfig:{
        accessPointId: accessPoint.accessPointId,
        iam: 'ENABLED'
      }
    }
  })
  container.addMountPoints({
    containerPath: '/mnt/weaviate',
    sourceVolume: "mntWeaviate",
    readOnly: false
  });

  task.addToTaskRolePolicy(
    new iam.PolicyStatement({
      actions: [
        'elasticfilesystem:ClientRootAccess',
        'elasticfilesystem:ClientWrite',
        'elasticfilesystem:ClientMount',
        'elasticfilesystem:DescribeMountTargets'
      ],
      resources: [fs.fileSystemArn]
    })
  )
  task.addToTaskRolePolicy(
    new iam.PolicyStatement({
      actions: ['ec2:DescribeAvailabilityZones'],
      resources: ['*']
    })
  );

  // ---
  // Services: string them together
  // ---
  const weaviateService = new ecs_patterns.ApplicationLoadBalancedFargateService(stack, "weaviate-service", {
    serviceName: "weaviate",
    cluster, // Required
    ...resources,
    desiredCount: 1,  // Default is 1
    taskDefinition: task,
    listenerPort: 8080,
    // TODO make this false, and setup allowFromAnyIp below to only Lambda incoming
    publicLoadBalancer: false,
  })
  // weaviateService.service.connections.allowFromAnyIpv4(
  //   ec2.Port.tcp(8080), "weaviate inbound"
  // )
  const weaviateUrl = weaviateService.loadBalancer.loadBalancerDnsName

  stack.addOutputs({
    weaviateUrl_: weaviateUrl
  })

  return weaviateUrl
}

type Lambdas = MLService & {weaviateUrl: string}
function lambdas({context: {app, stack}, vpc, fs, weaviateUrl}: Lambdas) {
  // Our ML functions need HF models (large files) cached. Two options:
  // 1. Save HF model into docker image (see git-lfs sample)
  // 2. Save HF models in EFS mount, cache folder
  // - https://aws.amazon.com/blogs/compute/hosting-hugging-face-models-on-aws-lambda/
  // - https://github.com/cdk-patterns/serverless/blob/main/the-efs-lambda/typescript/lib/the-efs-lambda-stack.ts
  // Going with option 2 to save on lambda-start & CDK deployment times

  const accessPoint = efsAccessPoint({
    fs,
    id: "LambdaAccessPoint",
    path: "transformers"
  })

  const mlFunctionProps = {
    // we need only about 4-6gb RAM; but we need the CPU power given by higher ram:
    // https://stackoverflow.com/a/66523153
    memorySize: 8846,
    timeout: cdk.Duration.minutes(10),
    vpc,
    filesystem: lambda.FileSystem.fromEfsAccessPoint(accessPoint, '/mnt/models')
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
    environment: {
      weaviate_host: `http://${weaviateUrl}`
    }
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
  const weaviateUrl = weaviate({context, vpc, fs})
  const {fnSearch, fnSummarize} = lambdas({context, vpc, fs, weaviateUrl})

  return {
    fnSearch,
    fnSummarize,
    weaviateUrl
  }
}
