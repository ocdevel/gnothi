import * as sst from "@serverless-stack/resources";
import { Database } from "./Database";
import { Ml } from "./Ml";
import { Auth } from './Auth'
import * as iam from "aws-cdk-lib/aws-iam"
import * as cdk from "aws-cdk-lib";
import {smallLamdaRam, timeouts} from './util'

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

  // Create a function we can call manually, as well as the same thing which is init'd on deploy
  const initProps: sst.FunctionProps = {
    memorySize: smallLamdaRam,
    handler: "init.main",
    bind: [
      APP_REGION,
      rds,
    ]
  }
  const fnInit = new sst.Function(stack, "fn_init", initProps)
  stack.addOutputs({
    fnInitArn: fnInit.functionArn
  })
  // const initScript = new sst.Script(stack, "script_init", {
  //   onCreate: {
  //     ...initProps,
  //     enableLiveDev: false
  //   }
  // })

  // the ML functions based on Dockerfiles can't use .bind(), so add the permissions explicitly, and
  // the env-var as Config() + bind (latter needed for unit tests, which can't use env vars directly)
  const fnBooksName = new sst.Config.Parameter(stack, "fn_books_name", {value: ml.fnBooks.functionName})
  const fnAskName = new sst.Config.Parameter(stack, "fn_ask_name", {value: ml.fnAsk.functionName})
  const fnSummarizeName = new sst.Config.Parameter(stack, "fn_summarize_name", {value: ml.fnSummarize.functionName})
  const fnStoreName = new sst.Config.Parameter(stack, "fn_store_name", {value: ml.fnStore.functionName})
  const fnPreprocessName = new sst.Config.Parameter(stack, "fn_preprocess_name", {value: ml.fnPreprocess.functionName})

  const fnBackground = new sst.Function(stack, "fn_background", {
    handler: "main.main",
    timeout: "3 minutes",
    memorySize: smallLamdaRam,
    permissions: [
      // when I put this in bind[], it says no access
      ws,
    ],
    bind: [
      fnBooksName,
      fnAskName,
      fnSummarizeName,
      fnStoreName,
      fnPreprocessName,

      APP_REGION,
      API_WS,
      rds,
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

  const fnMain = new sst.Function(stack, "fn_main", {
    memorySize: smallLamdaRam,
    timeout: timeouts.md,
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
