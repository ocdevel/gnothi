import * as sst from "@serverless-stack/resources";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as efs from "aws-cdk-lib/aws-efs";
import * as ecr from "aws-cdk-lib/aws-ecr-assets";
import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs"
import logs from 'aws-cdk-lib/aws-logs'
import ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns'
import {ApplicationProtocol} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import {DockerImageAsset} from "aws-cdk-lib/aws-ecr-assets";

export function Ml(context: sst.StackContext) {
  const { app, stack } = context
  // Getting a cyclical deps error when I have these all as different stacks, per
  // sst recommended usage. Just calling them as functions for now
  // https://gist.github.com/lefnire/4018a96ddee49d10b9a96c42b5698820


  /**
   * VPC & FS
   */

  // We try to get away with as much serverless as possible, but some resources
  // need ot run more traditionally. For this, have a universal VPC the different resources
  // can communicate behind
  const vpc = new ec2.Vpc(stack, 'VpcMain', {
    maxAzs: 2, // Default is all AZs in the region
  })

  // creates a file system in EFS to store cache models, weaviate data, etc
  const fs = new efs.FileSystem(stack, 'EfsMain', {
    vpc,
    removalPolicy: cdk.RemovalPolicy.DESTROY
  });

  const accessPoint = fs.addAccessPoint('AccessPoint', {
    createAcl: {
      ownerGid: '1001',
      ownerUid: '1001',
      permissions: '750'
    },
    path: '/export/mldata',
    posixUser: {
      gid: '1001',
      uid: '1001'
    }
  })

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
   */
  // CPU/RAM mappings at https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-cpu-memory-error.html
  // TODO distribute these more intelligently through the tasks/services, I don't want to think right now
  const resources = {
    cpu: 2048, // Default is 256
    memoryLimitMiB: 4096 // Default is 512
  } as const

  const cluster = new ecs.Cluster(stack, "MlCluster", {vpc})

  // a4829616 - t2v-transformers module. Having trouble with CloudMapping connecting
  // the services, but I don't need the module anyway (using Haystack).

  const weaviateTask = new ecs.FargateTaskDefinition(stack, "weaviate-task", {
    ...resources
  })
  weaviateTask.addContainer("weaviate", {
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
      PERSISTENCE_DATA_PATH: '/var/lib/weaviate',
      DEFAULT_VECTORIZER_MODULE: 'none',
      ENABLE_MODULES: 'ref2vec-centroid',
      CLUSTER_HOSTNAME: 'node1'
    }
  })

  // ---
  // Services: string them together
  // ---
  const weaviateService = new ecs_patterns.NetworkLoadBalancedFargateService(stack, "weaviate-service", {
    serviceName: "weaviate",
    cluster, // Required
    ...resources,
    desiredCount: 1,  // Default is 1
    taskDefinition: weaviateTask,
    listenerPort: 8080,
    // TODO make this false, and setup allowFromAnyIp below to only Lambda incoming
    publicLoadBalancer: true,
  })
  weaviateService.service.connections.allowFromAnyIpv4(
    ec2.Port.tcp(8080), "weaviate inbound"
  )

  stack.addOutputs({
    weaviateUrl: weaviateService.listener.loadBalancer.loadBalancerDnsName
  })


  /**
   * Lambdas
   */
   // Our ML functions need HF models (large files) cached. Two options:
  // 1. Save HF model into docker image (see git-lfs sample)
  // 2. Save HF models in EFS mount, cache folder
  // - https://aws.amazon.com/blogs/compute/hosting-hugging-face-models-on-aws-lambda/
  // - https://github.com/cdk-patterns/serverless/blob/main/the-efs-lambda/typescript/lib/the-efs-lambda-stack.ts
  // Going with option 2 to save on lambda-start & CDK deployment times

  const mlFunctionProps = {
    // we need only about 4-6gb RAM; but we need the CPU power given by higher ram:
    // https://stackoverflow.com/a/66523153
    memorySize: 8846,
    timeout: cdk.Duration.minutes(10),
    vpc,
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
    fnSummarize,
    weaviate: weaviateService
  }
}
