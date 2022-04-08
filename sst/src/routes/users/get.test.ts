import router from '../router'
import {withDb} from "../../util/tests";

it("users.get", withDb('usersGet', async (db) => {
  const res = await router({
    route: "/users",
    method: "POST",
    body: {id: 'xxx', email: "x@y.com"}
  })
  const res = await router("/users", "GET", {})
  expect(res.email).toBe("x@y.com")
}))
