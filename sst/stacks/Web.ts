import { use, StackContext, StaticSite, Job } from "sst/constructs";
import { Api } from "./Api";
import { Auth } from "./Auth";
import { Misc } from "./Misc";

export function Web({ app, stack }: StackContext) {
  const {http, ws} = use(Api);
  const {auth} = use(Auth)
  const {domain, subdomain} = use(Misc)

  const environment = {
    VITE_API_WS: ws.url,
    VITE_API_HTTP: http.url,

    VITE_REGION: app.region,
    VITE_USER_POOL_ID: auth.userPoolId,
    VITE_USER_POOL_CLIENT_ID: auth.userPoolClientId,
  }
  const site = new StaticSite(stack, "site", {
    path: "web",
    buildCommand: "npm run build",
    buildOutput: "dist",
    environment,
    customDomain: ["prod", "staging"].includes(app.stage) ? subdomain : undefined,
    vite: {
      types: "types/my-env.d.ts"
    }
  })

  stack.addOutputs({
    VITE_CONFIG_: JSON.stringify(environment),
  })

  stack.addOutputs({
    WEB: site.url,
  })
}
