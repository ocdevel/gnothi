import * as sst from "@serverless-stack/resources";
import { SharedImport } from './Shared'
import {StringAttribute} from 'aws-cdk-lib/aws-cognito'
import {aws_ec2, RemovalPolicy} from 'aws-cdk-lib'
import {smallLamdaRam, timeouts} from "./util";
import * as iam from "aws-cdk-lib/aws-iam";

export function Auth({ app, stack }: sst.StackContext) {
  const {vpc, rdsSecret, readSecretPolicy, withRds} = sst.use(SharedImport);

  // SST samples
  // Cognito JWT example from https://sst.dev/examples/how-to-add-jwt-authorization-with-cognito-user-pool-to-a-serverless-api.html
  // What is the IdentityPool one? https://sst.dev/examples/how-to-add-cognito-authentication-to-a-serverless-api.html

  // aws-samples/websockets
  // https://github.dev/aws-samples/websocket-api-cognito-auth-sample


  const testFn = withRds(stack,"TestFn2", {
    memorySize: smallLamdaRam,
    timeout: timeouts.sm,
    handler: "auth/testFn.main",
  })

  stack.addOutputs({
    testFnArn: testFn.functionArn
  })
  return null


  const preSignUp = new sst.Function(stack, "PreSignUp", {
    memorySize: smallLamdaRam,
    timeout: timeouts.md,
    handler: "auth/preSignup.handler",
    environment: {
      // maybe only need secretArn? Does it contain everything? (if so, can remove the full clusterId import/export)
      clusterIdentifier: rds.clusterIdentifier,
      secretArn: rdsSecret.secretArn,
    }
  })
  // stack.addOutputs({
  //   secretArn2: rds.secret.secretArn
  // })
  rdsSecret.grantRead(preSignUp)


  const auth = new sst.Cognito(stack, "Auth", {
    login: ["email"],

    cdk: {
      // userPoolClient: {
      //   authFlows: {
      //     userPassword: true,
      //     userSrp: true
      //   }
      // },
      userPool: {
        // TODO change these for stage/prod
        passwordPolicy: {
          // TODO removing all password requirements. Reconsider if we want to enforce this.
          requireDigits: false,
          minLength: 8,
          requireLowercase: false,
          requireSymbols: false,
          requireUppercase: false
        },
        selfSignUpEnabled: true,
        autoVerify: {email: true},
        removalPolicy: RemovalPolicy.DESTROY,
        customAttributes: {
          // TODO remove these next fresh start (can't remove on existing stack), I couldn't get them working
          // 'gnothiId': new StringAttribute({ minLen: 5, maxLen: 15, mutable: false }),
          'gnothiId': new StringAttribute({ mutable: true }),
        },
      }
    },
    // defaults: {
    //   environment: { tableName: table.tableName },
    //   permissions: [table],
    // },

    // https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html
    triggers: {
      preSignUp: {
        memorySize: smallLamdaRam,
        timeout: timeouts.md,
        handler: "auth/preSignup.handler",
        bind: [rds]
      },
      postConfirmation: {
        memorySize: smallLamdaRam,

        // TODO switch back to .md when fix RDS cold-start (migrate to v2)
        timeout: timeouts.lg,
        // timeout: timeouts.md,
        handler: "auth/postConfirmation.handler",
        bind: [rds]
      },
    }
  })

  const authFn = new sst.Function(stack, "fn_authorizer", {
    handler: "auth/wsAuthorizer.handler",
    memorySize: smallLamdaRam,
    timeout: timeouts.md,
    environment: {
      USER_POOL_ID: auth.userPoolId,
      USER_POOL_CLIENT_ID: auth.userPoolClientId
    }
  })

  stack.addOutputs({
    UserPoolId: auth.userPoolId,
    IdentityPoolId: auth.cognitoIdentityPoolId!,
    UserPoolClientId: auth.userPoolClientId,
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

  // const api = new Api(stack, "Api", {
  //   authorizers: {
  //     jwt: {
  //       type: "user_pool",
  //       userPool: {
  //         id: auth.userPoolId,
  //         clientIds: [auth.userPoolClientId],
  //       },
  //     },
  //   },
  //   defaults: {
  //     authorizer: "jwt",
  //   },
  //   routes: {
  //     "GET /private": "functions/private.main",
  //     "GET /public": {
  //       function: "functions/public.main",
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
  return {auth, authFn}
}
