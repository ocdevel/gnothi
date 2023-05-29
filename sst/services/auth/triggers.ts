// Keeping multiple Cognito Triggers in a single Lambda function, so that the various steps of the flow
// remain warm. Even if that means steps which don't need the DB will still use it.

import {db} from '../data/dbSingleton'
const testing = process.env.IS_LOCAL
import type {BaseTriggerEvent} from "aws-lambda/trigger/cognito-user-pool-trigger/_common";
import {users} from '../data/schemas/users'
import {tags} from '../data/schemas/tags'
import {APIGatewayRequestAuthorizerEvent, PostConfirmationTriggerEvent, PreSignUpTriggerEvent} from "aws-lambda";
import {Logger} from "../aws/logs";
import {eq, sql} from "drizzle-orm";
// see https://github.dev/aws-samples/websocket-api-cognito-auth-sample

export async function main(event: BaseTriggerEvent<any>, context) {
  // List of keys here
  // https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html#cognito-user-pools-lambda-trigger-event-parameter-shared
  // if (event.triggerSource.endsWith("_SignUp")) {
  if (event.triggerSource === "PreSignUp_SignUp") {
    return preSignUp(event as PreSignUpTriggerEvent, context)
  }
  if (event.triggerSource === "PostConfirmation_ConfirmForgotPassword") {
    return postConfirmationConfirmForgotPassword(event as PostConfirmationTriggerEvent, context)
  }
  if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
    return postConfirmationConfirmSignUp(event as PostConfirmationTriggerEvent, context)
  }
}

async function preSignUp(event: PreSignUpTriggerEvent, context) {
  // if (event.request.userAttributes['custom:adminCreated'] === 'true') {
  //   return
  // }

  // Set the user pool autoConfirmUser flag after validating the email domain
  event.response.autoConfirmUser = true
  // event.response.autoVerifyPhone = true
  event.response.autoVerifyEmail = true

  // Return to Amazon Cognito
  return event

  // // Split the email address so we can compare domains
  // var address = event.request.userAttributes.email.split("@")
  //
  // // This example uses a custom attribute "custom:domain"
  // if (event.request.userAttributes.hasOwnProperty("custom:domain")) {
  //     if ( event.request.userAttributes['custom:domain'] === address[1]) {
  //         event.response.autoConfirmUser = true;
  //     }
  // }
}

async function postConfirmationConfirmForgotPassword(event: PostConfirmationTriggerEvent, context) {
  const res = await db.drizzle.select({created_at: users.created_at})
    .from(users).where(eq(users.cognito_id, event.userName))
  if (res.length) {
    Logger.metric({event: "users_confirmforgotpassword", user: res[0]})
  }
  return event
}

async function postConfirmationConfirmSignUp(event: PostConfirmationTriggerEvent, context) {

  // User already exists, and was manually imported into Cognito as part of the v0 -> v1 migration.
  // Skip the extra stuff
  if (event.request.userAttributes['custom:adminCreated'] === 'true') {
    // make sure custom:gnothiId is added on user-import!
    return event
  }

  // create user in database. maybe add its uid to cognito
  const res = await db.drizzle.insert(users).values({
    email: event.request.userAttributes.email,
    cognito_id: event.userName,
    // These were accepted client-side in registration form
    accept_terms_conditions: new Date(),
    accept_privacy_policy: new Date(),
    accept_disclaimer: new Date()
  }).returning()
  const user = res[0]
  const uid = user.id
  event.request.userAttributes['custom:gnothiId'] = uid as string

  Logger.metric({event: "users_signup", user})

  // All users need one immutable main tag
  const mainTag = await db.drizzle.insert(tags).values({
    user_id: uid,
    name: "Main",
    main: true
  })

  // TODO send email

  return event
}


// var aws = require('aws-sdk');
// var ses = new aws.SES();
// export const postConfirmationWithEmail = (event, context, callback) => {
//   console.log(event);
//
//   if (event.request.userAttributes.email) {
//     sendEmail(event.request.userAttributes.email, "Congratulations " + event.userName + ", you have been confirmed: ", function (status) {
//
//       // Return to Amazon Cognito
//       callback(null, event);
//     });
//   } else {
//     // Nothing to do, the user's email ID is unknown
//     callback(null, event);
//   }
// };
//
// function sendEmail(to, body, completedCallback) {
//   var eParams = {
//     Destination: {
//       ToAddresses: [to]
//     },
//     Message: {
//       Body: {
//         Text: {
//           Data: body
//         }
//       },
//       Subject: {
//         Data: "Cognito Identity Provider registration completed"
//       }
//     },
//
//     // Replace source_email with your SES validated email address
//     Source: "<source_email>"
//   };
//
//   var email = ses.sendEmail(eParams, function (err, data) {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log("===EMAIL SENT===");
//     }
//     completedCallback('Email sent');
//   });
//   console.log("EMAIL CODE END");
// };
