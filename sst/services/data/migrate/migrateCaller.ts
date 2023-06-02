// This file just calls the migrate Lambda ./migrate.ts. This allows us to use this function as an sst.Script
// without any kinds of permissions or setup, save calling FnMigrate.

import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import {fromUtf8} from "@aws-sdk/util-utf8-node";

// Set up AWS SDK clients
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION }); // replace with your preferred region

interface Event {
  wipe?: boolean
  first?: boolean
  rest?: boolean
}
export async function onUpdate(event: Event) {
  const Payload = fromUtf8(JSON.stringify(event))
  return lambdaClient.send(new InvokeCommand({
    InvocationType: "RequestResponse",
    Payload,
    FunctionName: process.env.FN_MIGRATE
  }))
}
