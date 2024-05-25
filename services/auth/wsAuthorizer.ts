// see https://github.dev/aws-samples/websocket-api-cognito-auth-sample

import {APIGatewayRequestAuthorizerHandler} from "aws-lambda";
import {CognitoJwtVerifier} from "aws-jwt-verify";
import {Logger} from "../aws/logs";
import {SimpleJwksCache} from "aws-jwt-verify/jwk";
import {SimpleJsonFetcher} from "aws-jwt-verify/https";

const UserPoolId = process.env.USER_POOL_ID!;
const AppClientId = process.env.USER_POOL_CLIENT_ID!;

export const handler: APIGatewayRequestAuthorizerHandler = async (event, context) => {
  try {
    const verifier = CognitoJwtVerifier.create({
      userPoolId: UserPoolId,
      tokenUse: "id",
      clientId: AppClientId,
    }, {
      jwksCache: new SimpleJwksCache({
        fetcher: new SimpleJsonFetcher({
          defaultRequestOptions: {
            responseTimeout: 20000, // 1500=default. 30sec is Lambda max. Go for shy of Lambda max
            // Additional request options:
            // For NodeJS: https://nodejs.org/api/http.html#httprequestoptions-callback
            // For Web (init object): https://developer.mozilla.org/en-US/docs/Web/API/fetch#syntax
          },
        }),
      }),
    });

    const encodedToken = event.queryStringParameters!.idToken!;
    const payload = await verifier.verify(encodedToken);
    console.log("Token is valid. Payload:", payload);

    return allowPolicy(event.methodArn, payload);
  } catch (error) {
    // not using Logger to reduce imports for this tiny function
    Logger.error("auth/wsAuthorizer#handler", {error})
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
