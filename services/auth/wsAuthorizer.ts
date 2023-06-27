// see https://github.dev/aws-samples/websocket-api-cognito-auth-sample

import {APIGatewayRequestAuthorizerHandler} from "aws-lambda";
import {CognitoJwtVerifier} from "aws-jwt-verify";

const UserPoolId = process.env.USER_POOL_ID!;
const AppClientId = process.env.USER_POOL_CLIENT_ID!;

export const handler: APIGatewayRequestAuthorizerHandler = async (event, context) => {
  try {
    const verifier = CognitoJwtVerifier.create({
      userPoolId: UserPoolId,
      tokenUse: "id",
      clientId: AppClientId,
    });

    const encodedToken = event.queryStringParameters!.idToken!;
    const payload = await verifier.verify(encodedToken);
    console.log("Token is valid. Payload:", payload);

    return allowPolicy(event.methodArn, payload);
  } catch (error) {
    // not using Logger to reduce imports for this tiny function
    console.error("auth/wsAuthorizer#handler", JSON.stringify(error, null, 2))
    return denyAllPolicy();
  }
};

const denyAllPolicy = () => {
  return {
    principalId: "*",
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "*",
          Effect: "Deny",
          Resource: "*",
        },
      ],
    },
  };
};

const allowPolicy = (methodArn: string, idToken: any) => {
  return {
    principalId: idToken.sub,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: "Allow",
          Resource: methodArn,
        },
      ],
    },
    context: {
      // set userId in the context
      userId: idToken.sub,
      // could use `jwt: {claims: {sub: idToken.sub}}` for http consistency,
      // but hitting snags on `context` compatibility
    },
  };
};
