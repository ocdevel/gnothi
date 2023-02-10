/**
 * Misc helper Lambda functions, like migrations, etc
 */
import {rams, timeouts} from "./util";
import * as sst from "@serverless-stack/resources";
import {SharedImport} from "./Shared";

export function Misc({ app, stack }: sst.StackContext) {
  const {vpc, rdsSecret, readSecretPolicy, withRds} = sst.use(SharedImport);

  const dbMigrate = withRds(stack, "DbMigrate2", {
    memorySize: rams.sm,
    timeout: timeouts.sm,
    handler: "data/migrations/index.main",
    bundle: {
      copyFiles: [{from: "data/init/init.sql"}]
    },
  })

  stack.addOutputs({
    dbMigrate: dbMigrate.functionArn
  })

  // const initScript = new sst.Script(stack, "script_init", {
  //   onCreate: {
  //     ...initProps,
  //     enableLiveDev: false,
  //   }
  // })
}
