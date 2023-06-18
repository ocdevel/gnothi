import {db} from '../data/dbSingleton'
import {DB} from '../data/db'
import {eq} from 'drizzle-orm'
import {users} from '../data/schemas/users'
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
  return {
    statusCode: 200,
    body
  }

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



