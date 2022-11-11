import router from 'routes/router'
import {withDB} from "util/tests";

const test = "users.get"
it(test, withDB(
  test,
  ['users.me'],
  async (context
) => {
  const get = await router({
    route: "/users",
    method: "GET",
    body: {id: context.user.id}
  }, context)
  expect(get[0].id).toEqual(context.user.id)
}))
