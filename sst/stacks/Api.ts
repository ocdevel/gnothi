import * as sst from "@serverless-stack/resources";
import { Database } from "./Database";
import { Ml } from "./Ml";
import { Auth } from './Auth'
import * as iam from "aws-cdk-lib/aws-iam"

export function Api({ app, stack }: sst.StackContext) {
  const rds = sst.use(Database);
  const ml = sst.use(Ml);
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

  const fnInit = new sst.Function(stack, "fn_init", {
    handler: "init.main",
    bind: [
      APP_REGION,
      rds,
    ]
  })
  stack.addOutputs({
    fnInitArn: fnInit.functionArn
  })

  const mlFnPerms = [
    new iam.PolicyStatement({
       actions: ["*"],
       effect: iam.Effect.ALLOW,
       resources: [
         ml.fnSummarize.functionArn,
       ],
     }),
  ]

  const fnBackground = new sst.Function(stack, "fn_background", {
    handler: "main.main",
    timeout: "10 minutes",
    // the ML functions based on Dockerfiles can't use .bind(). Use the old way: permissions + environment
    environment: {
      fn_summarize: ml.fnSummarize.functionName,
    },
    permissions: [
      ...mlFnPerms
    ],
    bind: [
      APP_REGION,
      API_WS,
      rds,
      ml.fnSearch,
    ]
  })

  const fnMain = new sst.Function(stack, "fn_main", {
    handler: "main.proxy",
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
