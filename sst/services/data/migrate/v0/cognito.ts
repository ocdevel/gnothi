import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminConfirmSignUpCommand
} from "@aws-sdk/client-cognito-identity-provider"; // ES Modules import
// const { CognitoIdentityProviderClient, AdminCreateUserCommand } = require("@aws-sdk/client-cognito-identity-provider"); // CommonJS import
import {User} from '../../schemas/users'
import {randomInt} from 'crypto';

import {Config} from "sst/node/config";
import {AdminCreateUserCommandOutput} from "@aws-sdk/client-cognito-identity-provider/dist-types/commands";
const config = {region: "us-east-1"}
const UserPoolId = "us-east-1_4hM7QhkGe"// Config.USER_POOL_ID
const client = new CognitoIdentityProviderClient(config);


function randomPassword(length=32): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[randomInt(charset.length)];
  }
  return password;
}


// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/preview/client/cognito-identity-provider/command/AdminCreateUserCommand/
// https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_AdminCreateUser.html

export async function addUserToCognito(user: Partial<User>): Promise<string> {
  const createCommand = new AdminCreateUserCommand({ // AdminCreateUserRequest
    UserPoolId, // required
    Username: user.email, // required
    UserAttributes: [ // AttributeListType
      // Use this to skip Triggers if needed (preSignUp, postConfirmation, etc)
      {
        Name: "custom:adminCreated", // required
        Value: "true",
      },
      {
        Name: "custom:gnothiId",
        Value: user.id,
      },
      {
        Name: 'email',
        Value: user.email,
      },
      {
        Name: 'email_verified',
        Value: 'true',
      },
    ],
    // ValidationData: [
    //   {
    //     Name: "STRING_VALUE", // required
    //     Value: "STRING_VALUE",
    //   },

    // ],
    // TemporaryPassword: randomPassword(),
    ForceAliasCreation: false, // true || false,
    MessageAction: "SUPPRESS", //"RESEND" || "SUPPRESS",
    DesiredDeliveryMediums: [], // ["SMS" || "EMAIL"] // DeliveryMediumListType
    // ClientMetadata: { // ClientMetadataType
    //   "<keys>": "STRING_VALUE",
    // },
  })
  const createResponse = await client.send(createCommand);
  // required for them not to be stuck in "User password cannot be reset in the current state" vs
  // FORCE_CHANGE_PASSWORD rock/hard-plcae
  // const confirmCommand = new AdminConfirmSignUpCommand({
  //   UserPoolId,
  //   Username: user.email,
  //
  // });
  // const confirmResponse = await client.send(confirmCommand)
  // { // AdminCreateUserResponse
  //   User: { // UserType
  //     Username: "STRING_VALUE",
  //     Attributes: [ // AttributeListType
  //       { // AttributeType
  //         Name: "STRING_VALUE", // required
  //         Value: "STRING_VALUE",
  //       },
  //     ],
  //     UserCreateDate: new Date("TIMESTAMP"),
  //     UserLastModifiedDate: new Date("TIMESTAMP"),
  //     Enabled: true || false,
  //     UserStatus: "UNCONFIRMED" || "CONFIRMED" || "ARCHIVED" || "COMPROMISED" || "UNKNOWN" || "RESET_REQUIRED" || "FORCE_CHANGE_PASSWORD",
  //     MFAOptions: [ // MFAOptionListType
  //       { // MFAOptionType
  //         DeliveryMedium: "SMS" || "EMAIL",
  //         AttributeName: "STRING_VALUE",
  //       },
  //     ],
  //   },
  // };
  return createResponse.User.Username
}
