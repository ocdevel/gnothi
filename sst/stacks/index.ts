import { App } from "@serverless-stack/resources";
import { Api } from "./Api";
import { Web } from "./Web";
import { Database } from "./Database";
import { Auth } from "./Auth";

export default function main(app: App) {
  app.setDefaultFunctionProps({
    runtime: "nodejs16.x",
    srcPath: "services",
    bundle: {
      format: "esm",
    },
  });
  app.stack(Database).stack(Auth).stack(Api).stack(Web);
}
