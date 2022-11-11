import { use, StackContext, ViteStaticSite } from "@serverless-stack/resources";
import { Api } from "./Api";
import { Auth } from "./Auth";

export function Web({ app, stack }: StackContext) {
 const {http, ws} = use(Api);
 const {auth} = use(Auth)

  const site = new ViteStaticSite(stack, "site", {
    path: "web",
    buildCommand: "npm run build",
    environment: {
      VITE_API_WS: ws.url,
      VITE_API_HTTP: http.url,

      VITE_REGION: app.region,
      VITE_USER_POOL_ID: auth.userPoolId,
      VITE_USER_POOL_CLIENT_ID: auth.userPoolClientId,
    },
  });

  stack.addOutputs({
    WEB: site.url,
  });
}
