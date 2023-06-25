import {db} from '../data/dbSingleton'
import {DB} from '../data/db'
import {eq, sql} from 'drizzle-orm'
import {users} from '../data/schemas/users'
import {db} from '../data/dbSingleton'
import _ from 'lodash'
// import aws4 from 'aws4'
import axios from 'axios'

export async function main(event, context) {
  let body = '{"message": "no changes"}'
  if (event.event === 'users_update') {
    const {email, ...rest} = event.data
    const validUpdates = DB.removeUndefined(_.pick(rest, ['premium', 'is_cool', 'is_superuser']))
    const updated = await db.drizzle.update(users).set(validUpdates).where(eq(users.email, email)).returning()
    body = JSON.stringify(updated)
  }
  if (event.event === "affiliate") {
    await affiliate()
  }
  if (event.event === 'fix-orphans') {
    return fixOrphans()
  }
  return {
    statusCode: 200,
    body
  }
}

async function fixOrphans() {
  const res = await db.drizzle.execute(sql`
    WITH
    -- Find all entries which do not have any tags assigned
    untagged_entries AS (
      SELECT e.id AS entry_id, e.user_id
      FROM entries e
      WHERE NOT EXISTS (
        SELECT 1 FROM entries_tags et WHERE et.entry_id = e.id
      )
    ),
    -- Find the main tags for each user
    main_tags AS (
      SELECT t.id AS tag_id, t.user_id
      FROM tags t
      WHERE t.main = true
    )
    -- Insert into entries_tags table
    INSERT INTO entries_tags (entry_id, tag_id)
    SELECT ue.entry_id, mt.tag_id
    FROM untagged_entries ue
    JOIN main_tags mt
    ON ue.user_id = mt.user_id
    RETURNING *;
  `)
  return {statusCode: 200, body: JSON.stringify({
    count: res.rowCount
  })}
}

// Gotta get this working. Getting `AxiosError: socket hang up`
async function affiliate() {
  return null
  const isbn = "1592408419"
  const associateTag = ""

  const request = {
    host: 'webservices.amazon.com',
    method: 'POST',
    path: '/paapi5/searchitems',
    url: 'https://webservices.amazon.com/paapi5/searchitems',
    body: JSON.stringify({
      "Keywords": isbn,
      "SearchIndex": "All",
      "Resources": [
        "Images.Primary.Medium",
        "ItemInfo.ExternalIds",
        "ItemInfo.Title",
        "Offers.Listings.Price"
      ],
      "PartnerTag": associateTag,
      "PartnerType": "Associates",
      "Operation": "SearchItems"
    }),
    headers: {
      "Content-Type": "application/json",
    }
  };
  const credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN
  };

  aws4.sign(request, credentials);

  try {
    const res = await axios(request)
    console.log(res.data)
  } catch (err) {
    console.log(err)
  }
}



