import * as sst from "sst/constructs";
import { Ml } from "./Ml";
import { Auth } from './Auth'
import * as iam from "aws-cdk-lib/aws-iam"
import * as cdk from "aws-cdk-lib";
import {rams, timeouts} from './util'
import {SharedImport} from "./Shared";
import {Misc} from "./Misc";

export function Api({ app, stack }: sst.StackContext) {
  const {vpc, rdsSecret, readSecretPolicy, withRds} = sst.use(SharedImport);
  const ml = sst.use(Ml);
  const {auth, authFn} = sst.use(Auth);
  const {APP_REGION} = sst.use(Misc)


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

  // the ML functions based on Dockerfiles can't use .bind(), so add the permissions explicitly, and
  // the env-var as Config() + bind (latter needed for unit tests, which can't use env vars directly)
  const fnBooksName = new sst.Config.Parameter(stack, "fn_books_name", {value: ml.fnBooks.functionName})
  const fnAskName = new sst.Config.Parameter(stack, "fn_ask_name", {value: ml.fnAsk.functionName})
  const fnSummarizeName = new sst.Config.Parameter(stack, "fn_summarize_name", {value: ml.fnSummarize.functionName})
  const fnStoreName = new sst.Config.Parameter(stack, "fn_store_name", {value: ml.fnStore.functionName})
  const fnPreprocessName = new sst.Config.Parameter(stack, "fn_preprocess_name", {value: ml.fnPreprocess.functionName})

  const fnBackground = withRds(stack, "fn_background", {
    handler: "services/main.main",
    timeout: "3 minutes",
    memorySize: rams.sm,
    permissions: [
      // when I put this in bind[], it says no access
      ws,
    ],
    bind: [
      ml.openAiKey,
      fnBooksName,
      fnAskName,
      fnSummarizeName,
      fnStoreName,
      fnPreprocessName,

      APP_REGION,
      API_WS,
    ]
  })

  fnBackground.addToRolePolicy(new iam.PolicyStatement({
     actions: ["lambda:InvokeFunction"],
     effect: iam.Effect.ALLOW,
     resources: [
       ml.fnBooks.functionArn,
       ml.fnAsk.functionArn,
       ml.fnSummarize.functionArn,
       ml.fnStore.functionArn,
       ml.fnPreprocess.functionArn
     ],
   }))

  const fnMain = withRds(stack, "fn_main", {
    memorySize: rams.sm,
    timeout: timeouts.md,
    handler: "services/main.proxy",
    bind: [
      ml.openAiKey,
      APP_REGION,
      API_WS,
      auth,
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
