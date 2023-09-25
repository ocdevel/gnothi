/**
 * memorySize selection. Set some defaults here, but determine actual amount
 * after some time using a function.
 *
 * Set per function. See [1] querying maxMemory after some usage, set based on [2]
 * 1. https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax-examples.html
 * 2. https://stackoverflow.com/a/66523153
 *
 * filter @type = "REPORT"
 *     | stats max(@maxMemoryUsed / 1000 / 1000) as maxMemoryUsedMB,
 *          max(@maxMemoryUsed / 1000 / 1000) + max(@maxMemoryUsed / 1000 / 1000)*0.3 as recommendedMb,
 *          max(@duration / 1000) as maxDuration
 */

import {Duration} from 'aws-cdk-lib'

export const rams = {
  // 274 is the new recommended for fnMain, fnBackground after the credits update. I think it's because
  // of postgres-js, but TODO investigate. This is huge bump in Lambda costs
  // sm: 128,
  sm: 512,


  // md: 256, // haven't decided past small yet
  // lg: 512,

  ai: 8846
}

export const timeouts = {
  sm: "10 seconds" as const, //Duration.seconds(10),
  md: "30 seconds" as const, //Duration.seconds(30),
  lg: "3 minutes" as const, // Duration.minutes(3),
  xl: "15 minutes" as const, // Duration.minutes(15)
}
