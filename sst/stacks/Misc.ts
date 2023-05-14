/**
 * Misc helper Lambda functions, like migrations, etc
 */
import {rams, timeouts} from "./util";
import * as sst from "@serverless-stack/resources";
import {SharedImport, sharedStage} from "./Shared";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import {StackContext} from "@serverless-stack/resources";
import * as aws_ec2 from "aws-cdk-lib/aws-ec2";

export function Misc(context: sst.StackContext) {
  const { app, stack } = context
  const {vpc, rdsSecret, readSecretPolicy, withRds} = sst.use(SharedImport);

  // This the typical migration function, the below migration functions will be run once
  // to move the server over from old gnothi to new, then I'll delete those functions
  const dbMigrate = withRds(stack, "DbMigrate2", {
    memorySize: rams.sm,
    timeout: timeouts.sm,
    handler: "data/migrate.main",
    bundle: {
      copyFiles: [{from: "data/migrations"}]
    },
  })

  const {stage} = app
  const sharedStage_ = sharedStage(stage)

  const migratePy = new lambda.DockerImageFunction(stack, "fn_migrate_py", {
    memorySize: 5000, // depends on how I stream vs batch the DB rows
    timeout: cdk.Duration.minutes(15),
    vpc,
    vpcSubnets: {subnetType: aws_ec2.SubnetType.PRIVATE_WITH_EGRESS},
    environment: {
      rdsSecretArn: rdsSecret.secretArn,
      stage,
      sharedStage: sharedStage_,
      region: app.region,
      // TODO original DB creds
    },
    code: lambda.DockerImageCode.fromImageAsset("services/migrate/python", {
      file: "migrate.dockerfile"
    }),
  })
  migratePy.addToRolePolicy(readSecretPolicy)

  const migrateJs = new sst.Function(stack, "migrate_js", {
    vpc,
    vpcSubnets: {subnetType: aws_ec2.SubnetType.PRIVATE_WITH_EGRESS},
    // architecture: Architecture.ARM_64, // TODO try this, might be faster
    environment: {
      rdsSecretArn: rdsSecret.secretArn,
      stage,
      sharedStage: sharedStage_,
      migratePy: migratePy.functionArn,
    },
    memorySize: 5000,
    timeout: "15 minutes",
    handler: "migration/node/index.main",
    bundle: {
      copyFiles: [{from: "data/migrations"}],
      externalModules: ['pg-native'],
      format: "esm" // bundle overrides the bundle-defaults from stacks/index.ts
    },
  })
  migrateJs.addToRolePolicy(readSecretPolicy)

  stack.addOutputs({
    dbMigrate: dbMigrate.functionArn,
    bigMigration: migrateJs.functionArn
  })

  // const initScript = new sst.Script(stack, "script_init", {
  //   onCreate: {
  //     ...initProps,
  //     enableLiveDev: false,
  //   }
  // })
}
