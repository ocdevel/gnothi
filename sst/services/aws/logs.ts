import {clients} from './clients'
import { PutMetricDataCommand} from "@aws-sdk/client-cloudwatch";
import type {User} from '../data/schemas/users'

interface Log {
  event: string
  level?: "info" | "warn" | "error" | "metric"
  message?: string
  data?: any
}
interface Metric {
  event: string
  user?: Partial<User>
  dimensions?: {Name: string, Value: string}[]
}
export class Logger {
  static async log({event, level, message, data}: Log) {
    let data_ = {...data} || {}

    // Removing data.error if key present but value is undefined, to prevent filter on "error" catching
    if (data_.data?.hasOwnProperty("error") && !data_.data.error) {
      delete data_.data.error
    }

    // scrub data of personal information in prod/production. This is (I think always) on data.data
    if ("prod" === process.env.SST_STAGE) {
      delete data_.data
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
  static async metric({event, user, dimensions}: Metric) {
    try {
      let dimensions_: {Name: string, Value: string}[] = [{Name: "event", Value: event}]
      if (user) {
        dimensions_.push({
          Name: "v0",
          Value: String(new Date(user.created_at as string) < new Date("2023-05-28"))
        })
      }
      if (dimensions) {
        dimensions_.push(...dimensions)
      }
      return clients.cw.send(new PutMetricDataCommand({
        MetricData: [
          {
            MetricName: "UserEvent",
            Unit: 'Count',
            Value: 1,
            Dimensions: dimensions_
          },
        ],
        Namespace: `gnothi/${process.env.SST_STAGE}`,
      }));
    } catch (err) {
      console.log('Error putting metric data:', err);
    }
  }
}
