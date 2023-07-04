import type {User} from '../data/schemas/users'
import crypto from 'crypto'
interface Metric {
  event: string
  user: Pick<User, 'is_cool' | 'is_superuser' | 'created_at'>
  dimensions?: {Name: string, Value: string}[]
}

export class Logger {
  static log(event: string, data: unknown) {
    let data_ = {...data} || {}

    // Removing data.error if key present but value is undefined, to prevent filter on "error" catching
    if (data_.data?.hasOwnProperty("error") && !data_.data.error) {
      delete data_.data.error
    }

    // scrub data of personal information in prod/production. This is (I think always) on data.data
    if ("prod" === process.env.SST_STAGE) {
      delete data_.data
    }
    return console.log(event, JSON.stringify(data, null, 2))
  }
  static warn(event: string, data: unknown) {
    return console.warn(event, JSON.stringify(data, null, 2))
  }
  static error(event: string, data: unknown) {
    const data_ = {...data}
    // JSON.stringify won't add the stackTrace, just the error message.
    if (data.error?.stack) {
      data_.stack = data.error.stack
    }
    console.error(event, JSON.stringify(data_, null, 2))
  }
  static metric({event, user, dimensions}: Metric) {
    // this isn't "we give certain users no-tracking", it's: users with admin privs are spamming the app, and are
    // skewing the metrics
    if (user.is_cool || user.is_superuser) {return}
    if (!["prod", "staging"].includes(process.env.SST_STAGE)) {return}
    if (event.includes("_list_")
      || event.includes("_get_")
      || event.includes("_whoami_")
      || event.includes("_response")
      || event.includes("_cron")
      || event.includes("habitica_sync")
      || event.includes("stripe_webhook")
    ) {
      return
    }
    // Rather than actually sending the metric from here, we'll console.log() it and allow the aggregator Lambda
    // to listen to that; and it will handle metrics. This allows us to keep permissions, secrets, etc to one Lambda,
    // and to console.log synchronously while handling metric events async. Mostly why we're doing this is since it's
    // already there for collecting errors; might as well piggy-back for metrics.
    console.log(JSON.stringify({
      level: "METRIC",
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
    }))
  }

  static _hashId(id: string) {
    const hash = crypto.createHash('sha256');
    hash.update(id);
    return hash.digest('hex');
  }
}
