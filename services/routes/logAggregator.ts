import {CloudWatchLogsEvent} from "aws-lambda";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"
import zlib from 'zlib'
import {Config} from "sst/node/config";
import axios from "axios";
import {omit} from "lodash";

const sesClient = new SESClient({ region: "us-east-1" }); // replace with your region

interface LogEvent {
  id: string;
  timestamp: number;
  message: string;
}

const ToAddresses = process.env.LOG_TO_EMAILS?.split(',')?.filter(Boolean)

async function sendEmail(subject: string, data: unknown) {
  if (!ToAddresses) {return}
  try {
    await sesClient.send(new SendEmailCommand({
      Destination: {
        ToAddresses: ToAddresses
      },
      Message: {
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: JSON.stringify(data)
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject
        }
      },
      Source: "gnothi@gnothiai.com"
    }));
  } catch (error) {
    console.error('Failed to send email', error);
  }
}

function parseLogJson(logEvent: LogEvent) {
  const parts = logEvent.message.split('\t')
  const jsonPart = parts[parts.length - 1]
  try {
    const data = JSON.parse(jsonPart)
    return omit(data, ["level"])
  } catch (e) {
    return false
  }
}
async function sendMetrics(logEvents: LogEvent[]) {
  const metrics = logEvents.map(parseLogJson).filter(Boolean)
  const api_secret = Config.GA_API_SECRET
  const measurement_id = Config.GA_MEASUREMENT_ID
  await Promise.all(metrics.map(async metric => axios.post(
    `https://www.google-analytics.com/mp/collect?api_secret=${api_secret}&measurement_id=${measurement_id}`,
    metric
  )))
  await sendEmail("Gnothi Metric", metrics)
}
export async function main(event: CloudWatchLogsEvent, context: any) {
  const payload = Buffer.from(event.awslogs.data, 'base64');
  const decompressed = zlib.gunzipSync(payload);
  const logData = JSON.parse(decompressed.toString('utf8'));

  const logEvents = logData.logEvents as LogEvent[]

  const errorEvents = logEvents.filter(logEvent => logEvent.message.includes('ERROR'))
    .filter(logEvent => !logEvent.message.includes('Token expired'))
  const metricEvents = logEvents.filter(logEvent => logEvent.message.includes('METRIC'))

  if (metricEvents.length) {
    await sendMetrics(metricEvents)
  }

  if (errorEvents.length) {
    console.error(errorEvents)
    await sendEmail("Gnothi Error", errorEvents)
  }
};
