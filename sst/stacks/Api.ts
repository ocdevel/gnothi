import * as sst from "@serverless-stack/resources";
import { Database } from "./Database";
import { Auth } from './Auth'

export function Api({ app, stack }: sst.StackContext) {
  const rds = sst.use(Database);
  const {auth, authFn} = sst.use(Auth);
  const APP_REGION = new sst.Config.Parameter(stack, "APP_REGION", {value: app.region})

  const http = new sst.Api(stack, "api_http", {
    authorizers: {
      jwt: {
        type: "user_pool",
        userPool: {
          id: auth.userPoolId,
          clientIds: [auth.userPoolClientId],
        },
      },
    },
  })
  const ws = new sst.WebSocketApi(stack, "api_ws", {
    authorizer: {
      type: "lambda",
      identitySource: ["route.request.querystring.idToken"],
      function: authFn
    },
  })
  const API_WS = new sst.Config.Parameter(stack, "API_WS", {value: ws.cdk.webSocketStage.callbackUrl})

  const fn = new sst.Function(stack, "fn_main", {
    handler: "main.main",
    bind: [
      APP_REGION,
      API_WS,
      auth,
      rds
    ],
  })

  http.addRoutes(stack, {
    "POST /": {
      function: fn,
      authorizer: "jwt"
    },
  })
  ws.addRoutes(stack, {
    "$default": fn,
    "$connect": fn, // this is handled separately since SST applies authorizer to this routeKey only
    "$disconnect": fn, // and hell, might as well be consistent
  })

  stack.addOutputs({
    ApiHttp: http.url,
    ApiWs: ws.url,
  });

  auth.attachPermissionsForAuthUsers(stack, [http, ws]);

  return {http, ws};
}