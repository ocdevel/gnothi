import {initDb} from '../../data/init/init'
import {DB} from '../../data/db'
import {Misc} from '@gnothi/schemas'

export const main = async (req) => {
  await initDb()
  return []
  // const res = await DB.insertInto("users")
  //   .values(Object.values(S.Users.fakeData))
  //   .returning('id')
  //   .execute()
  // console.log(res)
}
