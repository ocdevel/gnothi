import { describe, it, expect, beforeAll } from "vitest";
import {Utils} from '../../tests/utils'

const utils = new Utils()
const longTimeout = 2 * 60 * 1000
describe("analyze:get_response", () => {
  beforeAll(async () => {
    await utils.signup()
    await utils.addEntries({n_summarize: 2, n_index: 2})
    await utils.wait(5)
  }, longTimeout)

  it("should run insights", async () => {
    const res = await utils.request({
      event: "analyze_get_response",
      data: {
        // search, startDate, endDate,
        tags: {[utils.noAiTag]: true, [utils.mainTag]: true}
      }
    })
    console.log(res)
  }, longTimeout)

  it.only("should run prompt:entry", async () => {
    const res = await utils.request({
      event: "analyze_prompt_request",
      data: {
        entry_ids: [utils.eids[0]],
        prompt: "Describe the following in one word: <entry>"
      }
    })
    console.log(res)
  })
})
