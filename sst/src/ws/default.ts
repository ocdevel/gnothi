import {APIGatewayProxyHandlerV2} from "./patchAws";
import { execute } from '../data/index'

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const {connectionId} = event.requestContext
  const result = await execute({
    sql: "SELECT * FROM connections WHERE connection_id=:connection_id",
    parameters: [
      {name:'connection_id', value: {stringValue: connectionId}}
    ]
  })
  return {
    statusCode: 200,
    // headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(result),
  };
};

