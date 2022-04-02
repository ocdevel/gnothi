import {
  RDSDataClient,
  ExecuteStatementRequest,
  ExecuteStatementResponse,
  ExecuteStatementCommand,
} from "@aws-sdk/client-rds-data";
import {ExecuteStatementRequestPartial} from './patchAws'

export const rds: RDSDataClient = new RDSDataClient({ region: process.env.AWS_REGION });

const defaults = {
  secretArn: process.env.SECRET_ARN,
  resourceArn: process.env.CLUSTER_ARN,
  database: process.env.DATABASE, // 'information_schema'
  // sql: 'SHOW TABLES',
  // includeResultMetadata: true,
}

export async function execute(params: ExecuteStatementRequestPartial): Promise<ExecuteStatementResponse> {
  const command = new ExecuteStatementCommand({
    ...defaults,
    ...params
  })
  const response = await rds.send(command)
  return response
}

