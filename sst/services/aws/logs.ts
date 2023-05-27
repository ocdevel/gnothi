import {clients} from './clients'
import { PutLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { PutMetricDataCommand} from "@aws-sdk/client-cloudwatch";
import * as _ from 'lodash'

// Should I unify these, multiple lambdas into one? Or re-use context.logStreamName or something?
const logStreamName = new Date().toISOString()
const combinedLogGroupName = process.env.COMBINED_LOG_GROUP_NAME


interface Log {
  event: string
  level?: "info" | "warn" | "error" | "metric"
  message?: string
  data?: any
}
export class Logger {
  static async log({event, level, message, data}: Log) {
    // scrub data of personal information in prod/production. This is (I think always) on data.data
    let data_ = data
    if (data?.data) {
      data_.data = _.mapValues(data.data, (v, k) => "redacted")
    }
    // Removing data.error if key present but value is undefined, to prevent filter on "error" catching
    if (data?.hasOwnProperty("error") && !data.error) {
      delete data_.error
    }
    
    const obj = {
      event,
      level: level || "info",
      data,
      // This allows deeper drilling via CloudWatch Insights. Eg, we can ignore anything not starting with "gnothi:"
      // and we can filter by "gnothi:error:", etc.
      message: `gnothi:${level}:${event} ${message}`,
    }

    // Log it here, now we can use CW Insights for this function
    console[level](obj)

    // And log it to a unified LogStream
    if (combinedLogGroupName) {
      await clients.cwl.send(new PutLogEventsCommand({
        logGroupName: combinedLogGroupName,
        logStreamName,
        logEvents: [
          {
            timestamp: Date.now(),
            message: JSON.stringify(obj) // Keep original log message
          }
        ]
      }));
    }

    if (level === "metric") {
      try {

        const putMetricResponse = await clients.cw.send(new PutMetricDataCommand({
          MetricData: [
            {
              MetricName: event,
              Unit: 'Count',
              Value: 1,
            },
          ],
          Namespace: process.env.SST_STAGE, // TODO reconsider this
        }));
        console.log(putMetricResponse);
      } catch (err) {
        console.log('Error putting metric data:', err);
      }
    }
  }
  static async info(log: Log) {
    return this.log({...log, level: "info"})
  }
  static async warn(log: Log) {
    return this.log({...log, level: "warn"})
  }
  static async error(log: Log) {
    return this.log({...log, level: "error"})
  }
  static async metric(log: Log) {
    return this.log({...log, level: "info"})
  }
}
