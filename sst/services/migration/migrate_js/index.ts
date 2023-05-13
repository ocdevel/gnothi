import {main as initDb} from '../../data/migrate'
import {APIGatewayEvent, APIGatewayProxyResult, Context} from "aws-lambda";
import {entries} from '../../data/schemas/entries'

import {sql} from "drizzle-orm/sql";
import {eq, and} from 'drizzle-orm/expressions'
import {sharedStage, DB} from "../../data/db"

export async function main(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
  // 1. First run the default migrate() script, which will init the DB structure.
  await initDb(event, context)

  const dbTarget = new DB(sharedStage)
  await dbTarget.init()

  // 2. Pull all the old data in Python. Necessary since only Python has the decrypt code needed to get
  // sensitive data out of old DB and into new
  await lambda.call("migrate_py")

  // 3. Now that the data is imported, we need to re-run all ML jobs. The old ML was crap, new summarise / keywords
  // etc should be re-generated.
  const entries = await dbTarget.drizzle.select().from(entries)
    .where(eq(entries.ai_state, "todo"))
  // TODO note about skip_ai
  for (e of entries) {
    await lambda.call("run_ml")
    // - each one does itself, then calls 2
  }
}
