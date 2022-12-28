import { describe, it, expect } from "vitest";
import {Utils} from '../../tests/utils'

describe("analyze:get_response", () => {
  it("should work", async () => {
    const utils = new Utils()
    const user = await utils.signup()
    await utils.addEntries({n_summarize: 2, n_index: 5})
    await utils.wait(5)
    const res = await utils.request({
      event: "analyze_get_response",
      data: {
        // search, startDate, endDate,
        tags: {[utils.noAiTag]: true, [utils.mainTag]: true}
      }
    })
    console.log(res)
  }, 2 * 60 * 1000);
});
