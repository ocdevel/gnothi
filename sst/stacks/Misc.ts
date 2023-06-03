/**
 * Misc helper Lambda functions, like migrations, etc
 */
import {rams, timeouts} from "./util";
import * as sst from "sst/constructs";
import {getDomains, SharedImport, sharedStage} from "./Shared";
import {Logs} from "./Logs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import {StackContext} from "sst/constructs";
import * as aws_ec2 from "aws-cdk-lib/aws-ec2";


export function Misc(context: sst.StackContext) {
  const { app, stack } = context
  const {withRds} = sst.use(SharedImport)
  const {addLogging} = sst.use(Logs)
  const domains = getDomains(app.stage)

  // Common / misc bucket. Used for ML, file-uploads, etc
  const bucket = new sst.Bucket(stack, "Bucket")

  // This the typical migration function, the below migration functions will be run once
  // to move the server over from old gnothi to new, then I'll delete those functions
  const fnMigrate = withRds(stack, "FnMigrate", {
    // memorySize: rams.sm,
    memorySize: 512, // due to pg migration from old site to new. DB size was ~250MB last I dumped
    timeout: "10 minutes", // old->new migration can take a while. I can reduce this later
    handler: "services/data/migrate/migrate.main",
    // copyFiles: [{from: "data/migrate"}],
    copyFiles: [{from: "services/data/migrate"}],
    bind: [
      // used to read the old SQL script or main migration
      bucket,
    ],
  })
  addLogging(fnMigrate, "FnMigrate")

  const FN_DB_MIGRATE = new sst.Config.Parameter(stack, "FN_DB_MIGRATE", {value: fnMigrate.functionArn})

  stack.addOutputs({
    bucket: bucket.bucketName,
    fnMigrate: fnMigrate.functionArn,
  })

  const migrateScript = new sst.Script(stack, "MigrateScript", {
    defaults: {
      function: {
        environment: { FN_MIGRATE: fnMigrate.functionArn },
        permissions: [fnMigrate],
      },
    },
    onUpdate: {
      handler:"services/data/migrate/migrateCaller.onUpdate",
    },
    params: { rest: true }
  })

  return {bucket, domains}
}
