import { describe, it, expect, beforeAll } from "vitest";
import {Utils} from '../../tests/utils'

const longTimeout = 2 * 60 * 1000

describe("entries", () => {
  it("entry:create", async () => {
    const utils = new Utils()
    await utils.signup()
    await utils.addEntries({n_summarize: 0, n_index: 1})
    const list = await utils.listEntries()
    expect(list.data.length).toBe(1)
  }, longTimeout)

  it("entry:create no title", async () => {
    const utils = new Utils()
    await utils.signup()
    await utils._addEntry("", "body of the entry", true)
    const list = await utils.listEntries()
    expect(list.data.length).toBe(1)
  }, longTimeout)

  it("entry:update", async () => {
    const utils = new Utils()
    await utils.signup()
    await utils.addEntries({n_summarize: 0, n_index: 1})
    const list1 = await utils.listEntries()
    const entry = list1.data[0]
    console.log({list1: entry})
    entry.text = "updated text"
    await utils.request({
      event: "entries_upsert_request",
      data: entry
    })
    // const list2 = await utils.listEntries()
    // expect(list2.data[0].entry.text).toBe("updated text")
  })
})
