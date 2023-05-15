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
  const {withRds} = sst.use(SharedImport)
  const APP_REGION = new sst.Config.Parameter(stack, "APP_REGION", {value: app.region})

  // Common / misc bucket. Used for ML, file-uploads, etc
  const bucket = new sst.Bucket(stack, "Bucket")

  const DB_URL_V0 = new sst.Config.Secret(stack, "DB_URL_V0")
  const FLASK_KEY_V0 = new sst.Config.Secret(stack, "FLASK_KEY_V0")

  // This the typical migration function, the below migration functions will be run once
  // to move the server over from old gnothi to new, then I'll delete those functions
  const dbMigrate = withRds(stack, "DbMigrate2", {
    // memorySize: rams.sm,
    memorySize: 512, // due to pg migration from old site to new. DB size was ~250MB last I dumped
    timeout: "10 minutes", // old->new migration can take a while. I can reduce this later
    handler: "data/migrate/migrate.main",
    bundle: {
      copyFiles: [{from: "data/migrate"}]
    },
    bind: [
      DB_URL_V0,
      FLASK_KEY_V0,
      APP_REGION,
      // used to read the old SQL script or main migration
      bucket,
    ],
  })

  stack.addOutputs({
    bucket: bucket.bucketName,
    dbMigrate: dbMigrate.functionArn,
  })

  // const initScript = new sst.Script(stack, "script_init", {
  //   onCreate: {
  //     ...initProps,
  //     enableLiveDev: false,
  //   }
  // })

  return {bucket, APP_REGION}
}
