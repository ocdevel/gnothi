import { describe, it, expect } from "vitest";
import {Utils} from '../../tests/utils'

describe.skip("sample", () => {
  it("should work", async () => {
    const utils = new Utils()
    const user = await utils.signup()
    const res = await utils.request({
      event: 'users_everything_request',
      data: {}
    })
    console.log(res)
  });
});
