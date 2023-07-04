import * as cdk from 'aws-cdk-lib';
import {
  aws_cloudwatch,
  aws_iam,
  aws_logs,
  aws_lambda,
  aws_sns,
  aws_sns_subscriptions,
  custom_resources,
  aws_logs_destinations,
  RemovalPolicy
} from 'aws-cdk-lib';
import * as sst from "sst/constructs";


export function Logs(context: sst.StackContext){
  const {app, stack} = context

  const GA_MEASUREMENT_ID = new sst.Config.Secret(stack, "GA_MEASUREMENT_ID")
  const GA_API_SECRET = new sst.Config.Secret(stack, "GA_API_SECRET")

  const fnLogAggregator = new sst.Function(stack, "FnLogAggregator", {
    handler: "services/routes/logAggregator.main",
    bind: [GA_MEASUREMENT_ID, GA_API_SECRET],
    memorySize: "128 MB",
    environment: {
      // comma-separated emails, in .env.{STAGE}
      ERROR_EMAILS: process.env.ERROR_EMAILS || "",
      METRIC_EMAILS: process.env.METRIC_EMAILS || "",
    }
  })
  // Allow the log aggregator to send emails
  fnLogAggregator.addToRolePolicy(new aws_iam.PolicyStatement({
    actions: ['ses:SendEmail', 'ses:SendRawEmail', "cloudwatch:PutMetricData"],
    resources: ['*'], // adjust this to your needs
  }))
  stack.addOutputs({
    LogAggregator: `AWS_PROFILE=${process.env.AWS_PROFILE} AWS_REGION=${app.region} aws logs tail --follow /aws/lambda/${fnLogAggregator.functionName}`
  })

  function addLogging(fn: sst.Function | aws_lambda.Function, id: string) {
    // Need a unique ID for the Filter & Alarm, but fn.id / fn.functionName aren't working
    // const id = fn.functionArn.replace(/[^A-Za-z0-9]/g, '');
    fn.logGroup.addSubscriptionFilter(`SubscriptionFilter${id}`, {
      destination: new aws_logs_destinations.LambdaDestination(fnLogAggregator),
      filterPattern: aws_logs.FilterPattern.anyTerm("ERROR", "Error", "error", "EXCEPTION", "Exception", "exception", "WARN", "Warn", "warn", "METRIC"),
    })
  }

  return {addLogging}
}

// git-blame for CloudWatch Alarm (email) using MetricFilter
// git-blame for CloudWatchMetricQuery as AWS-managed log aggregator