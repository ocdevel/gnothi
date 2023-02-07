import { App } from "@serverless-stack/resources";
import { Api } from "./Api";
import { Web } from "./Web";
import { Database } from "./Database";
import { Auth } from "./Auth";
import { Ml } from "./Ml";
import { Tags } from 'aws-cdk-lib';
import { SharedCreate, SharedImport, sharedStage } from './Shared'

export default function main(app: App) {
  const stage = app.stage
  Tags.of(app).add('app', 'gnothi')
  Tags.of(app).add('stage', stage)
  Tags.of(app).add('stageShared', sharedStage(stage))

  app.setDefaultFunctionProps({
    runtime: "nodejs16.x",
    srcPath: "services",
    bundle: {
      format: "esm",
    },
  })

  if (stage.startsWith("shared")) {
    app.stack(SharedCreate)
  } else {
    app.stack(SharedImport)
      .stack(Auth)
      // .stack(Ml)
      // .stack(Api)
      // .stack(Web)
  }
}
