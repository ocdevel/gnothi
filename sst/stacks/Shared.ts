/**
 * These are services which can be created once and shared across stages.
 * Eg, for test/dev/staging, we can have one VPC and database cluster; while
 * using different DB schemas to separate them. This can save significant money.
 * For prod, of course, everything should be silo'd.
 *
 * Resource-sharing options
 * - import/export x-stack strings: https://bobbyhadz.com/blog/import-value-aws-cdk-cross-stack
 * - pass env to stack: https://stackoverflow.com/a/71737152 (TODO try this)
 */

import * as sst from "@serverless-stack/resources";
import * as aws_ec2 from "aws-cdk-lib/aws-ec2";
import * as aws_rds from "aws-cdk-lib/aws-rds";
import * as aws_ssm from "aws-cdk-lib/aws-ssm";
import * as aws_secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as cdk from "aws-cdk-lib";
import {RDS, RDSProps, StackContext} from "@serverless-stack/resources";
import { Construct } from "constructs";

export function sharedStage(stage: string) {
  return stage === "prod" ? "prod" : "dev"
}

export function exportName(stage: string, name: string) {
  return `${sharedStage(stage)}${name}`
}

export function SharedCreate(context: StackContext) {
  const {stack, app} = context
  const {stage} = app
  const sharedStage_ = sharedStage(stage)

  function createVpc(): aws_ec2.Vpc {
    // Private subnet setup: https://adrianhesketh.com/2022/05/31/create-vpc-with-cdk/,
    // https://bobbyhadz.com/blog/aws-cdk-vpc-example
    return new aws_ec2.Vpc(stack, 'Vpc', {
      maxAzs: 2, // Default is all AZs in the region
      natGateways: 1,
      // enableDnsSupport: true,
      // enableDnsHostnames: true,
      // subnetConfiguration: [
      //   {
      //     name: "isolated-subnet-1",
      //     subnetType: aws_ec2.SubnetType.PRIVATE_ISOLATED,
      //     cidrMask: 28,
      //   },
      // ]
    })
  }

  function createRdsV1(): RDS {
    return new RDS(stack, "Rds", {
      scaling: {
        autoPause: true,
        minCapacity: "ACU_2",
        maxCapacity: "ACU_8",
      },
      engine: "postgresql11.13",
      defaultDatabaseName: `gnothi${stage}`,
      migrations: "services/data/migrations"
    })
  }

  function createRdsV2(vpc: aws_ec2.Vpc): aws_rds.DatabaseCluster {
    // TODO Aurora v2 via https://github.com/aws/aws-cdk/issues/20197#issuecomment-1360639346
    // need to re-work most things
    // Also see https://www.codewithyou.com/blog/aurora-serverless-v2-with-aws-cdk
    const rds = new aws_rds.DatabaseCluster(stack, "Rds", {
      engine: aws_rds.DatabaseClusterEngine.auroraPostgres({
        version: aws_rds.AuroraPostgresEngineVersion.VER_14_4,
      }),
      instanceProps: {
        vpc,
        instanceType: "serverless" as any,
        autoMinorVersionUpgrade: true
      },
    });
    // Edit the generated cloudformation construct directly:
    (
      rds.node.findChild("Resource") as aws_rds.CfnDBCluster
    ).serverlessV2ScalingConfiguration = {
      minCapacity: 0.5,
      maxCapacity: 4,
    }
    return rds
  }

  function exportVars(vpc: aws_ec2.Vpc, rds: aws_rds.DatabaseCluster) {
    // Doesn't work - can't resolve tokens later: "All arguments to Vpc.fromLookup() must be concrete (no Tokens)"
    // https://lzygo1995.medium.com/how-to-resolve-all-arguments-to-vpc-fromlookup-must-be-concrete-no-tokens-error-in-cdk-add1c2aba97b
    function toExports([k, v]: [string, string]) {
      const sharedKey = exportName(stage, k)
      // add exportName ot value (flesh out value, rather than passing string) so we can import elsewhere
      stack.addOutputs({[sharedKey]: {value: v, exportName: sharedKey}})
      return null
    }

    function toSsm([k, v]: [string, string]) {
      const sharedKey = exportName(stage, k)
      // adding stackOutput anyway, but just for console.log (not exported variable)
      stack.addOutputs({[sharedKey]: v})
      return new aws_ssm.StringParameter(stack, `ssm${sharedKey}`, {
        parameterName: sharedKey,
        stringValue: v
      })
    }

    const exported = Object.entries({
      VpcId: vpc.vpcId,
      ClusterIdentifier: rds.clusterIdentifier,
      RdsSecretArn: rds.secret!.secretArn
    // }).map(toExports)
    }).map(toSsm)

    return exported
  }

  const vpc = createVpc()
  const rds = createRdsV2(vpc)
  const exported = exportVars(vpc, rds)
  return {vpc, rds, exported}
}


export function SharedImport(context: StackContext) {
  const {app: {stage}, stack} = context
  const sharedStage_ = sharedStage(stage)

  function fromSsm(k: string, lazy=false) {
    // secretArn having trouble with this, not loaded in time. Using cdk.Lazy workaround.
    // https://stackoverflow.com/questions/70759640/how-best-to-retrieve-aws-ssm-parameters-from-the-aws-cdk
    const produce = () => aws_ssm.StringParameter.valueFromLookup(stack, exportName(stage, k))
    return lazy ? cdk.Lazy.string({produce}) : produce()
  }

  const vpc = aws_ec2.Vpc.fromLookup(stack, "Vpc", {
    vpcId: fromSsm("VpcId")
  })

  const rds = aws_rds.DatabaseCluster.fromDatabaseClusterAttributes(stack, 'Rds', {
    clusterIdentifier: fromSsm("ClusterIdentifier"),
  })

  const rdsSecret = aws_secretsmanager.Secret.fromSecretAttributes(stack, "RdsSecret", {
    secretPartialArn: fromSsm("RdsSecretArn", true)
  })

  stack.addOutputs({
    vpcId: vpc.vpcId,
    clusterIdentifier: rds.clusterIdentifier,
    rdsSecretArn: rdsSecret.secretArn,
    // rdsSecretArn: rds.secret.secretArn // this should be working, but secret isn't coming from load.
  })
  return {vpc, rds, rdsSecret}
}
