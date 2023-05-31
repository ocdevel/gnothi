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
  const APP_REGION = new sst.Config.Parameter(stack, "APP_REGION", {value: app.region})
  const {domain, subdomain} = getDomains(app.stage)

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
      APP_REGION,
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

  // Need to duplicate the migrate function unfortunately, since the one above is `enableLiveDev: true`.
  // Ideally let's have an `onCreate` with `params: {wipe:true,first:true}` and this onUpdate; then
  // remove the above function. I'm hanging tight on that until I trust the idea a bit more.
  // Edit: actually, I can't even get this working. Revisit later, I'll just run migrations manually for now
  // const fnMigrateScript = withRds(stack, "FnMigrateScript2", {
  //   handler: "services/data/migrate/migrate.main",
  //   copyFiles: [{from: "services/data/migrate"}],
  //   bind: [APP_REGION],
  //   enableLiveDev: false
  // })
  // const migrateScript = new sst.Script(stack, "MigrateScript", {
  //   onUpdate: fnMigrateScript,
  //   params: {
  //     rest: true
  //   }
  // })

  return {bucket, APP_REGION, domain, subdomain}
}
