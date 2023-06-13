import {clients} from './clients'
import { PutMetricDataCommand} from "@aws-sdk/client-cloudwatch";
import type {User} from '../data/schemas/users'
import crypto from 'crypto'
import axios from 'axios'
import {Config} from 'sst/node/config'

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
    // this isn't "we give certain users no-tracking", it's: users with admin privs are spamming the app, and are
    // skewing the metrics
    if (user.is_cool) {return}
    if (event.includes("_list_")
      || event.includes("_get_")
      || event.includes("_whoami_")
      || event.includes("_response")
    ) {
      return
    }
    const api_secret = Config.GA_API_SECRET
    const measurement_id = Config.GA_MEASUREMENT_ID
    await axios.post(`https://www.google-analytics.com/mp/collect?api_secret=${api_secret}&measurement_id=${measurement_id}`, {
      // Hash user id because I don't want to track them, just cohort flow. If this is still not ok, I'll
      // remove the user_id completely.
      // client_id: Logger._hashId(user.id),
      client_id: "server",
      events: [{
        name: event,
        params: {
          v0: new Date(user.created_at as string) < new Date("2023-05-28")
        }
      }]
    })
  }

  static _hashId(id: string) {
    const hash = crypto.createHash('sha256');
    hash.update(id);
    return hash.digest('hex');
  }
}
