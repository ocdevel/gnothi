import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda'
import { Client } from 'pg'

export async function main(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
  // get the secret from secrets manager.
  const client = new SecretsManagerClient({})
  const secret = await client.send(
    new GetSecretValueCommand({
      SecretId: process.env.rdsSecretArn,
    })
  )
  const secretValues = JSON.parse(secret.SecretString ?? '{}')

  console.log('secretValues', secretValues)

  // connect to the database
  console.log('new Client')
  const db = new Client({
    host: secretValues.host, // host is the endpoint of the db cluster
    port: secretValues.port, // port is 5432
    user: secretValues.username, // username is the same as the secret name
    password: secretValues.password, // this is the password for the default database in the db cluster
    database: secretValues.dbname ?? 'postgres', // use the default database if no database is specified
  })

  console.log('connecting')
  await db.connect()

  // execute a query
  console.log('querying')
  const res = await db.query('SELECT NOW()')

  // disconnect from the database
  console.log('ending')
  await db.end()

  const secretKeys = Object.keys(secretValues)

  console.log('responding')
  return {
    body: JSON.stringify({
      message: `DB Response: ${res.rows[0].now}. SecretKeys: ${secretKeys}`,
    }),
    statusCode: 200,
    isBase64Encoded: false,
    headers: {
      'Content-Type': 'application/json',
    },
  }
}
