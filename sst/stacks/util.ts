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

export const smallLamdaRam = 128
export const mlLambdaRam = 8846
