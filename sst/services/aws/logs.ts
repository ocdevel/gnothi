import {clients} from './clients'
import { PutLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { PutMetricDataCommand} from "@aws-sdk/client-cloudwatch";
import * as _ from 'lodash'

interface Log {
  event: string
  level?: "info" | "warn" | "error" | "metric"
  message?: string
  data?: any
}
export class Logger {
  static async log({event, level, message, data}: Log) {
    let data_ = {...data}
    // scrub data of personal information in prod/production. This is (I think always) on data.data
    if (["prod", "production"].includes(process.env.SST_STAGE)) {
      delete data_.data
    }
    // Removing data.error if key present but value is undefined, to prevent filter on "error" catching
    if (data?.hasOwnProperty("error") && !data.error) {
      delete data_.error
    }
    
    const obj = {
      event,
      level: level || "info",
      data: data_,
      // This allows deeper drilling via CloudWatch Insights. Eg, we can ignore anything not starting with "gnothi:"
      // and we can filter by "gnothi:error:", etc.
      message: `gnothi:${level}:${event} ${message}`,
    }

    // Log it here, now we can use CW Insights for this function
    console[level](obj)
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
  static async metric({event}: Log) {
    try {
      return clients.cw.send(new PutMetricDataCommand({
        MetricData: [
          {
            MetricName: event,
            Unit: 'Count',
            Value: 1,
          },
        ],
        Namespace: `gnothi/${process.env.SST_STAGE}`,
      }));
    } catch (err) {
      console.log('Error putting metric data:', err);
    }
  }
}
