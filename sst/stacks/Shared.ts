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
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ssm from "aws-cdk-lib/aws-ssm";
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

  function createVpc(): ec2.Vpc {
    // Private subnet setup: https://adrianhesketh.com/2022/05/31/create-vpc-with-cdk/,
    // https://bobbyhadz.com/blog/aws-cdk-vpc-example
    return new ec2.Vpc(stack, 'Vpc', {
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
  }

  function createDbV1(): RDS {
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

  function createDbV2(vpc: ec2.Vpc): rds.DatabaseCluster {
    // TODO Aurora v2 via https://github.com/aws/aws-cdk/issues/20197#issuecomment-1360639346
    // need to re-work most things
    // Also see https://www.codewithyou.com/blog/aurora-serverless-v2-with-aws-cdk
    const db = new rds.DatabaseCluster(stack, "Rds", {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_14_4,
      }),
      instanceProps: {
        vpc,
        instanceType: "serverless" as any,
        autoMinorVersionUpgrade: true
      },
    });
    // Edit the generated cloudformation construct directly:
    (
      db.node.findChild("Resource") as rds.CfnDBCluster
    ).serverlessV2ScalingConfiguration = {
      minCapacity: 0.5,
      maxCapacity: 4,
    }
    return db
  }

  function exportVars(vpc: ec2.Vpc, db: rds.DatabaseCluster) {
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
      return new ssm.StringParameter(stack, `ssm${sharedKey}`, {
        parameterName: sharedKey,
        stringValue: v
      })
    }

    const exported = Object.entries({
      VpcId: vpc.vpcId,
      ClusterIdentifier: db.clusterIdentifier
    // }).map(toExports)
    }).map(toSsm)

    return exported
  }

  const vpc = createVpc()
  const db = createDbV2(vpc)
  const exported = exportVars(vpc, db)
  return {vpc, db, exported}
}


export function SharedImport(context: StackContext) {
  const {app: {stage}, stack} = context
  const sharedStage_ = sharedStage(stage)

  const vpcId = ssm.StringParameter.valueFromLookup(stack, exportName(stage, "VpcId"))
  console.log({vpcId})
  const vpc = ec2.Vpc.fromLookup(stack, "Vpc", {
    vpcId
  })

  const clusterIdentifier = ssm.StringParameter.valueFromLookup(stack, exportName(stage, "ClusterIdentifier"))
  const db = rds.DatabaseCluster.fromDatabaseClusterAttributes(stack, 'Rds', {
    clusterIdentifier,
  })

  stack.addOutputs({
    vpcId: vpc.vpcId,
    clusterIdentifier: db.clusterIdentifier,
  })
  return {vpc, db}
}
