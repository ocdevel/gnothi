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

  const fnAnalyze = new sst.Function(stack, 'fn_analyze', {
    runtime: "python3.9",
    handler: "ml/analyze.main",
    timeout: "10 minutes", // definitely needed for ML functions
  })

  // Use same unifier framework as the main function (http, ws) but is called with background tasks.
  // Needed so the fnMain can return a response first
  const fnBackground = new sst.Function(stack, "fn_background", {
    handler: "main.main",
    timeout: "10 minutes",
    bind: [
      APP_REGION,
      API_WS,
      rds,
      fnAnalyze,
    ]
  })

  const fnMain = new sst.Function(stack, "fn_main", {
    handler: "main.main",
    bind: [
      APP_REGION,
      API_WS,
      auth,
      rds,
      fnBackground,
    ]
  })

  http.addRoutes(stack, {
    "POST /": {
      function: fnMain,
      authorizer: "jwt"
    },
  })
  ws.addRoutes(stack, {
    "$default": fnMain,
    "$connect": fnMain, // this is handled separately since SST applies authorizer to this routeKey only
    "$disconnect": fnMain, // and hell, might as well be consistent
  })

  stack.addOutputs({
    ApiHttp: http.url,
    ApiWs: ws.url,
  });

  auth.attachPermissionsForAuthUsers(stack, [http, ws]);

  return {http, ws};
}
