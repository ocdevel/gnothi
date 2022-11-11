import {SNSClient} from "@aws-sdk/client-sns";
import {ApplicationAutoScalingClient} from "@aws-sdk/client-application-auto-scaling";
import {SageMakerRuntimeClient} from "@aws-sdk/client-sagemaker-runtime";
import {SageMakerClient} from "@aws-sdk/client-sagemaker";
import {CloudWatchLogsClient} from "@aws-sdk/client-cloudwatch-logs";
import {LambdaClient} from "@aws-sdk/client-lambda";
import {ApiGatewayManagementApiClient} from "@aws-sdk/client-apigatewaymanagementapi";
import {S3Client} from "@aws-sdk/client-s3";
import {SecretsManagerClient} from "@aws-sdk/client-secrets-manager";

import {Config} from "@serverless-stack/node/config";

const config = {region: Config.APP_REGION}

class Clients {
  private _sns?: SNSClient
  private _s3?: S3Client
  private _lambda?: LambdaClient
  private _aas?: ApplicationAutoScalingClient
  private _smRuntime?: SageMakerRuntimeClient
  private _sm?: SageMakerClient
  private _apig?: ApiGatewayManagementApiClient
  private _cwl?: CloudWatchLogsClient

  public get sns(): SNSClient {
    if ( !this._sns ) { this._sns = new SNSClient(config) }
    return this._sns
  }

  public get s3(): S3Client {
    if ( !this._s3 ) { this._s3 = new S3Client(config) }
    return this._s3
  }

  public get lambda(): LambdaClient {
    if ( !this._lambda ) { this._lambda = new LambdaClient(config) }
    return this._lambda
  }

  public get aas(): ApplicationAutoScalingClient {
    if ( !this._aas ) { this._aas = new ApplicationAutoScalingClient(config) }
    return this._aas
  }

  public get smRuntime(): SageMakerRuntimeClient {
    if ( !this._smRuntime ) { this._smRuntime = new SageMakerRuntimeClient(config) }
    return this._smRuntime
  }

  public get sm(): SageMakerClient {
    if ( !this._sm ) { this._sm = new SageMakerClient(config) }
    return this._sm
  }

  public get cwl(): CloudWatchLogsClient {
    if ( !this._cwl ) { this._cwl = new CloudWatchLogsClient(config) }
    return this._cwl
  }

  public get apig(): ApiGatewayManagementApiClient {
    if ( !this._apig ) { this._apig = new ApiGatewayManagementApiClient({
      endpoint: Config.API_WS,
      ...config
    }) }
    return this._apig
  }
}

export const clients = new Clients()
