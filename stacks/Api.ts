import * as sst from "sst/constructs";
import { Ml } from "./Ml";
import { Auth } from './Auth'
import * as iam from "aws-cdk-lib/aws-iam"
import * as cdk from "aws-cdk-lib";
import {rams, timeouts} from './util'
import {SharedImport} from "./Shared";
import {Misc} from "./Misc";
import {Logs} from "./Logs";

export function Api({ app, stack }: sst.StackContext) {
  const {vpc, rdsSecret, readSecretPolicy, withRds} = sst.use(SharedImport);
  const ml = sst.use(Ml);
  const {addLogging} = sst.use(Logs)
  const {auth, fnAuth} = sst.use(Auth)

  const HABITICA_USER = new sst.Config.Secret(stack, "HABITICA_USER")
  const HABITICA_APP = new sst.Config.Secret(stack, "HABITICA_APP")
  const STRIPE_SK = new sst.Config.Secret(stack, "STRIPE_SK")
  const STRIPE_WHSEC = new sst.Config.Secret(stack, "STRIPE_WHSEC")

  // For some reason, Cognito updates cause a full change here, and give error about authorizer
  // non-unique name:
  // CREATE_FAILED Resource handler returned message: "Authorizer name must be unique. Authorizer WebSocketAuthorizer already exists in this RestApi. (Service: AmazonApiGatewayV2; Status Code: 400; Error Code: BadRequestException; Request ID: ...; Proxy: null)" (RequestToken: ..., HandlerErrorCode: AlreadyExists)
  // Resource handler returned message: "Authorizer name must be unique. Authorizer jwt already exists in this RestApi. (Service: AmazonApiGatewayV2; Status Code: 400; Error Code: BadRequestException; Request ID: ...; Proxy: null)" (RequestToken: ..., HandlerErrorCode: AlreadyExists)
  // So you have to find-replace jwt -> jwt2, and back.

  const ws = new sst.WebSocketApi(stack, "ApiWs", {
    authorizer: {
      name: 'wsjwt2',
      type: "lambda",
      identitySource: ["route.request.querystring.idToken"],
      function: fnAuth
    },
  })
  const API_WS = new sst.Config.Parameter(stack, "API_WS", {value: ws.cdk.webSocketStage.callbackUrl})

  const http = new sst.Api(stack, "ApiHttp", {
    authorizers: {
      httpjwt2: {
        type: "user_pool",
        userPool: {
          id: auth.userPoolId,
          clientIds: [auth.userPoolClientId],
        },
      },
    },
    defaults: {
      authorizer: "httpjwt2",
    },
  })
  // const api = new Api(stack, "Api", {
  //   defaults: {
  //     authorizer: "iam",
  //   },
  //   routes: {
  //     "GET /private": "functions/private.handler",
  //     "GET /public": {
  //       function: "functions/public.handler",
  //       authorizer: "none",
  //     },
  //   },
  // });

  // export const main: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  //   event
  // ) => {
  //   return {
  //     statusCode: 200,
  //     body: `Hello ${event.requestContext.authorizer.jwt.claims.sub}!`,
  //   };
  // };

  // the ML functions based on Dockerfiles can't use .bind(), so add the permissions explicitly, and
  // the env-var as Config() + bind (latter needed for unit tests, which can't use env vars directly)
  const FN_BOOKS_NAME = new sst.Config.Parameter(stack, "FN_BOOKS_NAME", {value: ml.fnBooks.functionName})
  const FN_ASK_NAME = new sst.Config.Parameter(stack, "FN_ASK_NAME", {value: ml.fnAsk.functionName})
  const FN_SUMMARIZE_NAME = new sst.Config.Parameter(stack, "FN_SUMMARIZE_NAME", {value: ml.fnSummarize.functionName})
  const FN_STORE_NAME = new sst.Config.Parameter(stack, "FN_STORE_NAME", {value: ml.fnStore.functionName})
  const FN_PREPROCESS_NAME = new sst.Config.Parameter(stack, "FN_PREPROCESS_NAME", {value: ml.fnPreprocess.functionName})
  const FN_BEHAVIORS_NAME = new sst.Config.Parameter(stack, "FN_BEHAVIORS_NAME", {value: ml.fnBehaviors.functionName})

  const fnBackground = withRds(stack, "FnBackground", {
    handler: "services/main.main",
    timeout: timeouts.xl,
    memorySize: rams.sm,
    permissions: [
      // when I put this in bind[], it says no access
      ws,
    ],
    bind: [
      ml.OPENAI_KEY,
      FN_BOOKS_NAME,
      FN_ASK_NAME,
      FN_SUMMARIZE_NAME,
      FN_STORE_NAME,
      FN_PREPROCESS_NAME,
      FN_BEHAVIORS_NAME,

      API_WS,
    ]
  })
  addLogging(fnBackground, "FnBackground")

  fnBackground.addToRolePolicy(new iam.PolicyStatement({
     actions: ["lambda:InvokeFunction"],
     effect: iam.Effect.ALLOW,
     resources: [
       ml.fnBooks.functionArn,
       ml.fnAsk.functionArn,
       ml.fnSummarize.functionArn,
       ml.fnStore.functionArn,
       ml.fnPreprocess.functionArn,
       ml.fnBehaviors.functionArn,
     ],
   }))

  const fnMain = withRds(stack, "FnMain", {
    memorySize: rams.sm,
    timeout: timeouts.md,
    handler: "services/main.proxy",
    bind: [
      ml.OPENAI_KEY,
      API_WS,
      auth,
      fnBackground,
      HABITICA_USER,
      HABITICA_APP,
      STRIPE_SK,
      STRIPE_WHSEC
    ]
  })
  addLogging(fnMain, "FnMain")

  // basically duplicating fnMain, but with fewer permissions and maxed-out timeout
  const fnCron = withRds(stack, "FnCron", {
    memorySize: rams.sm,
    timeout: timeouts.xl,
    handler: "services/main.proxy",
    environment: {
      CRON: "true"
    },
    bind: [
      API_WS,
      HABITICA_USER,
      HABITICA_APP,
    ]
  })
  addLogging(fnCron, "FnCron")

  // behaviors. Need to slowly start renaming
  const cronFields = new sst.Cron(stack, "CronFields", {
    schedule: "rate(1 hour)",
    job: fnCron,
    // enabled: true
    enabled: "prod" === app.stage
  })

  http.addRoutes(stack, {
    "POST /": {
      function: fnMain,
      authorizer: "httpjwt2"
    },
    "POST /stripe/webhook": {
       function: fnMain,
       authorizer: "none",
     },
  })
  ws.addRoutes(stack, {
    "$default": fnMain,
    "$connect": fnMain, // this is handled separately since SST applies authorizer to this routeKey only
    "$disconnect": fnMain, // and hell, might as well be consistent
  })

  stack.addOutputs({
    ApiHttpUrl: http.url,
    ApiWsUrl: ws.url,
  });

  auth.attachPermissionsForAuthUsers(stack, [http, ws]);

  return {http, ws};
}
