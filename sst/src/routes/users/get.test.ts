import router from '../router'
import * as f from '../../util/fixtures'
import {withDB} from "../../util/tests";

const test = "users.get"
it(test, withDB(test, async (context) => {
  const post = await router({
    route: "/users",
    method: "POST",
    body: f.users.me
  }, context)
  const uid = post[0].id
  expect(uid).toBeDefined()
  const get = await router({
    route: "/users",
    method: "GET",
    body: {id: uid}
  }, context)
  expect(get[0].id).toEqual(uid)
}))
