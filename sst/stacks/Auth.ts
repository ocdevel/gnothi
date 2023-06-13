import * as sst from "sst/constructs";
import { SharedImport } from './Shared'
import {StringAttribute, BooleanAttribute} from 'aws-cdk-lib/aws-cognito'
import {aws_ec2, RemovalPolicy} from 'aws-cdk-lib'
import {rams, timeouts} from "./util";
import * as iam from "aws-cdk-lib/aws-iam";
import * as aws_cognito from "aws-cdk-lib/aws-cognito";
import {Misc} from './Misc'
import {Logs} from './Logs'

import {SesConfigStack} from "./Ses";

export function Auth({ app, stack }: sst.StackContext) {
  const {
    vpc,
    rdsSecret,
    readSecretPolicy,
    withRds
  } = sst.use(SharedImport);
  const {addLogging} = sst.use(Logs);
  const {domains, GA_API_SECRET, GA_MEASUREMENT_ID} = sst.use(Misc)

  // SST samples
  // Cognito JWT example from https://sst.dev/examples/how-to-add-jwt-authorization-with-cognito-user-pool-to-a-serverless-api.html
  // What is the IdentityPool one? https://sst.dev/examples/how-to-add-cognito-authentication-to-a-serverless-api.html

  // aws-samples/websockets
  // https://github.dev/aws-samples/websocket-api-cognito-auth-sample

  const fnAuthTriggers = withRds(stack, "FnAuthTriggers", {
    memorySize: rams.sm,
    timeout: timeouts.md,
    handler: "services/auth/triggers.main",
    bind: [GA_API_SECRET, GA_MEASUREMENT_ID]
  })
  addLogging(fnAuthTriggers, "FnAuthTriggers")


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
        passwordPolicy: {
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
          fromEmail: `gnothi@${domains.root}`,
          fromName: 'Gnothi',
          replyTo: `gnothi@${domains.root}`,
          sesVerifiedDomain: domains.root,
        }),
      }
    },

    // defaults: {
    //   environment: { tableName: table.tableName },
    //   permissions: [table],
    // },

    // https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html
    triggers: {
      preSignUp: fnAuthTriggers,
      postConfirmation: fnAuthTriggers,
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
  addLogging(fnAuth, "FnAuthorizer")

  stack.addOutputs({
    UserPoolId: auth.userPoolId,
    IdentityPoolId: auth.cognitoIdentityPoolId!,
    UserPoolClientId: auth.userPoolClientId,
  })

  return {auth, fnAuth}
}
