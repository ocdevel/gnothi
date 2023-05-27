import * as cdk from 'aws-cdk-lib';
import {
  aws_cloudwatch,
  aws_iam,
  aws_logs,
  aws_sns,
  aws_sns_subscriptions,
  custom_resources,
  RemovalPolicy
} from 'aws-cdk-lib';
import * as sst from "sst/constructs";

export function Logs(context: sst.StackContext){
  const {app, stack} = context

  // Create SNS topic
  const topic = new aws_sns.Topic(stack, 'TopicAlarms');

  const combinedLogGroup = new aws_logs.LogGroup(stack, 'CombinedLogGroup', {
    logGroupName: `/aws/lambda/${app.name}/${app.stage}/combined`,
    // Optionally, you can set the retention period (default is never expire)
    retention: aws_logs.RetentionDays.SIX_MONTHS,
    removalPolicy: RemovalPolicy.DESTROY,

  })

  // Add email subscription to SNS topic
  console.log(process.env.SES_SUBSCRIBE_EMAIL)
  topic.addSubscription(new aws_sns_subscriptions.EmailSubscription(process.env.SES_SUBSCRIBE_EMAIL));


  // Create CloudWatch metric filter
  const metricFilter = new aws_logs.MetricFilter(stack, `MetricFilter`, {
    logGroup: combinedLogGroup,  // Your Lambda function's log group
    filterPattern: aws_logs.FilterPattern.literal('"gnothi:error:"'),
    metricName: 'ErrorCount',
    metricNamespace: app.stage,
    metricValue: '1',
  });

  // Create CloudWatch alarm
  new aws_cloudwatch.Alarm(stack, `Alarm`, {
    metric: metricFilter.metric({}),
    threshold: 1,
    evaluationPeriods: 1,
    actionsEnabled: true,
    alarmActions: [topic],
  });

  // const createLogsPolicy = new aws_iam.PolicyStatement({
  //   actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
  //   resources: [combinedLogGroup.logGroupArn],
  // })
  function addLogging(fn: sst.Function) {
    combinedLogGroup.grantWrite(fn)
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

