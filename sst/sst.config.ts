import type { SSTConfig } from "sst"
import { Api } from "./stacks/Api";
import { Web } from "./stacks/Web";
import { Auth } from "./stacks/Auth";
import { Ml } from "./stacks/Ml";
import { Misc } from "./stacks/Misc";
import { Tags } from 'aws-cdk-lib';
import { SharedCreate, SharedImport, sharedStage } from './stacks/Shared'

export default {
  config(input) {
    return {
      "name": "gnothi",
      "region": "us-east-1",
      // profile: "my-company-dev"
    }
  },
  stacks(app) {
    app.setDefaultFunctionProps({
      runtime: "nodejs18.x",
      architecture: "arm_64",
      nodejs: {
        format: "esm"
      }
    })

    const stage = app.stage
    Tags.of(app).add('app', 'gnothi')
    Tags.of(app).add('stage', stage)
    Tags.of(app).add('stageShared', sharedStage(stage))

    if (stage.startsWith("shared")) {
      app.stack(SharedCreate)
    } else {
      app.stack(SharedImport)
        .stack(Misc)
        .stack(Auth)
        .stack(Ml)
        .stack(Api)
        .stack(Web)
    }
  },
} satisfies SSTConfig
