import * as cdk from 'aws-cdk-lib';
import {
  aws_cloudwatch,
  aws_iam,
  aws_logs,
  aws_sns,
  aws_sns_subscriptions,
  custom_resources,
  aws_logs_destinations,
  RemovalPolicy
} from 'aws-cdk-lib';
import * as sst from "sst/constructs";


export function Logs(context: sst.StackContext){
  const {app, stack} = context

  // Create SNS topic
  const topic = new aws_sns.Topic(stack, 'TopicAlarms');
  // Add email subscription to SNS topic
  console.log(process.env.SES_SUBSCRIBE_EMAIL)
  topic.addSubscription(new aws_sns_subscriptions.EmailSubscription(process.env.SES_SUBSCRIBE_EMAIL));

  function addLogging(fn: sst.Function, id: string) {
    // Need a unique ID for the Filter & Alarm, but fn.id / fn.functionName aren't working
    // const id = fn.functionArn.replace(/[^A-Za-z0-9]/g, '');

    // // Create CloudWatch metric filter
    // const metricFilter = new aws_logs.MetricFilter(stack, `MetricFilter${id}`, {
    //   logGroup: fn.logGroup,
    //
    //   filterPattern: aws_logs.FilterPattern.anyTerm(
    //     'ERROR', 'Error', 'error',
    //     'EXCEPTION', 'Exception', 'exception',
    //   ),
    //   // filterPattern: aws_logs.FilterPattern.stringValue('$.level', '=', 'ERROR'),
    //
    //   metricName: 'ErrorCount',
    //   metricNamespace: `${app.name}/${app.stage}`,
    //   metricValue: '1', // optional?
    // });
    //
    // // Create CloudWatch alarm
    // new aws_cloudwatch.Alarm(stack, `MetricAlarm${id}`, {
    //   metric: metricFilter.metric(), // metricFilter.metric({})
    //   threshold: 1,
    //   evaluationPeriods: 1,
    //   actionsEnabled: true,
    //
    //   // treatMissingData: TreatMissingData.IGNORE,
    //   comparisonOperator: aws_cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    //   // datapointsToAlarm: 1,
    //
    //   alarmActions: [topic],
    //   // alarmActions: [new aws_sns.SnsAction(topic)],
    // });

    // Grant the function permissions to PutMetricData on CloudWatch
    fn.addToRolePolicy(new aws_iam.PolicyStatement({
      actions: ['cloudwatch:PutMetricData'],
      resources: ['*'],
    }))
  }

  return {addLogging}
}

function cloudWatchInsightsQuery({app, stack}: sst.StackContext) {
  // stack is the name that will be visible in the AWS CloudWatch Logs Insights "Queries" tab.
  const queryName = `Errors_${app.stage}`;
  // Remember to format the query for readability purposes!
  const byAPIGWRequestIdQuery = `fields @timestamp, @logStream, @message
  | sort @timestamp desc
  | filter @requestId = "PASTE_REQUEST_ID_HERE"`;

  return new custom_resources.AwsCustomResource(stack, "insightsQuery", {
    policy: custom_resources.AwsCustomResourcePolicy.fromStatements([
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: ["logs:PutQueryDefinition", "logs:DeleteQueryDefinition"],
        resources: [`arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:*`]
      })
    ]),
    onCreate: {
      action: "putQueryDefinition",
      service: "CloudWatchLogs",
      parameters: {
        name: queryName,
        queryString: byAPIGWRequestIdQuery
      },
      physicalResourceId:
        custom_resources.PhysicalResourceId.fromResponse("queryDefinitionId")
    },
    onUpdate: {
      action: "putQueryDefinition",
      service: "CloudWatchLogs",
      parameters: {
        name: queryName,
        queryString: byAPIGWRequestIdQuery,
        queryDefinitionId: new custom_resources.PhysicalResourceIdReference()
      },
      physicalResourceId:
        custom_resources.PhysicalResourceId.fromResponse("queryDefinitionId")
    },
    onDelete: {
      action: "deleteQueryDefinition",
      service: "CloudWatchLogs",
      parameters: {
        queryDefinitionId: new custom_resources.PhysicalResourceIdReference()
      }
    }
  });
}

