import {Handler} from "aws-lambda/handler";
import {APIGatewayProxyEventV2, APIGatewayProxyResultV2} from "aws-lambda/trigger/api-gateway-proxy";
import {APIGatewayEventRequestContextWithAuthorizer} from "aws-lambda/common/api-gateway";

export type MyProxyEvent = APIGatewayProxyEventV2 & {
  requestContext: APIGatewayEventRequestContextWithAuthorizer<undefined> & {
    connectionId: string
  }
}

export type APIGatewayProxyHandlerV2<T = never> = Handler<MyProxyEvent, APIGatewayProxyResultV2<T>>;
