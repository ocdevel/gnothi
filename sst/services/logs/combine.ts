/**
 * All the different Lambda functions have their own logs. This makes it difficult to track in a unified way.
 * CloudWatch Insights lets you collect into one, but what if you want to stream? Also you'd have to add CloudWatch
 * Alarms to each individual Lambda. So this simple function listens on other logs, and collects them into its own.
 */
import { gunzip } from 'zlib';
import { promisify } from 'util';
import {CloudWatchLogsClient, GetLogEventsCommand, PutLogEventsCommand} from "@aws-sdk/client-cloudwatch-logs";

// if true, we forward to a separately-managed CombinedLogGroup. If false, we just console.log inline here,
// and this Lambda's logs are considered our CombinedLogGroup
const combinedLogGroupName = process.env.COMBINED_LOG_GROUP_NAME
const cwlClient = combinedLogGroupName
  ? new CloudWatchLogsClient({region: process.env.AWS_REGION})
  : null

const gunzipAsync = promisify(gunzip);

export const main = async function(event, context) {
  // The incoming event is a Base64 encoded, GZipped, string
  const payload = Buffer.from(event.awslogs.data, 'base64');

  // Decompress the payload
  const result = await gunzipAsync(payload);

  // Parse the result
  const parsed = JSON.parse(result.toString('utf8'));

  // Get the log events
  const logEvents = parsed.logEvents;

  if (!combinedLogGroupName) {
    return justLog(logEvents)
  }
  return forward(logEvents)
};

async function justLog(logEvents) {
  for (const logEvent of logEvents) {
    console.log(logEvent.message)
  }
}

async function forward(logEvents) {
  // Process each log event
  for (const logEvent of logEvents) {
    // LogEvent has a .message property, and optionally some other properties depending on the event

    // Here we're just forwarding the message as-is. You could modify this code to change the format
    // of the forwarded message or to include additional information.

    const params = {
      logGroupName: combinedLogGroupName, // The name of the destination LogGroup
      logStreamName: 'LogStream', // You'll probably want to customize this
      logEvents: [
        {
          timestamp: logEvent.timestamp, // Keep original timestamp
          message: logEvent.message // Keep original log message
        }
      ]
    };

    // Use the CloudWatchLogs client to send the log event to the destination LogGroup
    await cwlClient.send(new PutLogEventsCommand(params));
  }
}
