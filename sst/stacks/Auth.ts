import * as sst from "sst/constructs";
import { SharedImport, getDomains } from './Shared'
import {StringAttribute, BooleanAttribute} from 'aws-cdk-lib/aws-cognito'
import {aws_ec2, RemovalPolicy} from 'aws-cdk-lib'
import {rams, timeouts} from "./util";
import * as iam from "aws-cdk-lib/aws-iam";
import * as aws_cognito from "aws-cdk-lib/aws-cognito";
import {Misc} from './Misc'

import {SesConfigStack} from "./Ses";

export function Auth({ app, stack }: sst.StackContext) {
  const {
    vpc,
    rdsSecret,
    readSecretPolicy,
    withRds
  } = sst.use(SharedImport);
  const {domain, subdomain} = sst.use(Misc)

  // SST samples
  // Cognito JWT example from https://sst.dev/examples/how-to-add-jwt-authorization-with-cognito-user-pool-to-a-serverless-api.html
  // What is the IdentityPool one? https://sst.dev/examples/how-to-add-cognito-authentication-to-a-serverless-api.html

  // aws-samples/websockets
  // https://github.dev/aws-samples/websocket-api-cognito-auth-sample

  const preSignUp = withRds(stack, "PreSignUp", {
    memorySize: rams.sm,
    timeout: timeouts.md,
    handler: "services/auth/preSignup.handler",
  })
  const postConfirmation = withRds(stack, "PostConfirmation", {
    memorySize: rams.sm,
    timeout: timeouts.md,
    handler: "services/auth/postConfirmation.handler",
  })


  const auth = new sst.Cognito(stack, "Cognito", {
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

        // autoVerify=false means don't send an email
        autoVerify: {email: false},
        removalPolicy: RemovalPolicy.DESTROY,
        customAttributes: {
          'gnothiId': new StringAttribute({ mutable: true }),
          'adminCreated': new StringAttribute({ mutable: true }),
        },

        // accountRecovery: aws_cognito.AccountRecovery.EMAIL_ONLY,
        email: aws_cognito.UserPoolEmail.withSES({
          sesRegion: app.region,
          fromEmail: `gnothi@${subdomain}`,
          fromName: 'Gnothi',
          replyTo: `gnothi@${subdomain}`,
          sesVerifiedDomain: subdomain,
        }),
      }
    },

    // defaults: {
    //   environment: { tableName: table.tableName },
    //   permissions: [table],
    // },

    // https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html
    triggers: {
      preSignUp,
      postConfirmation
    }
  })

  const USER_POOL_ID = new sst.Config.Parameter(stack, "USER_POOL_ID", {
    value: auth.userPoolId,
  })
  const USER_POOL_CLIENT_ID = new sst.Config.Parameter(stack, "USER_POOL_CLIENT_ID", {
    value: auth.userPoolClientId,
  })

  const fnAuth = withRds(stack, "FnAuthorizer", {
    handler: "services/auth/wsAuthorizer.handler",
    memorySize: rams.sm,
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
  return {auth, fnAuth}
}
