import {test, expect, chromium} from '@playwright/test'
import type {Page} from '@playwright/test' 

// @ts-ignore
import {Utils} from './utils.ts'
// test("x", async ({page, browser}) => {
//   const browser = await chromium.launch({ headless: false, slowMo: 100 })
//   const page = await browser.newPage()
// })

const ai_text_bug = "FIXME - ai_text is being set to entry plaintext, meaning I can't test if is-ai (for the mouse-hover about-summary)."

test.describe("summaries", () => {
  test("sum:1 index:1", async ({page}) => {
    const utils = new Utils(page)
    await utils.addEntries({n_summarize: 1, n_index: 1})

    await expect(
      page.locator(".entries .list .teaser"),
      "Both entries show in list"
    ).toHaveCount(2)

    await expect.soft(
      page.locator(".entries .list .teaser .text.ai"),
      ai_text_bug
    ).toHaveCount(1)

    await expect(
      page.locator(".entries .insights .summarize .result"),
      "Sidebar summary has a result (from the entry with summary enabled)"
    ).toHaveCount(1)

    await page.locator(".entries .list .teaser").nth(0).click()
    await expect(page.locator(".entries .view .insights .summarize .result")).toHaveCount(1)
  })
  test("sum:0 index:1", async ({page}) => {
    const utils = new Utils(page)
    await utils.addEntries({n_summarize: 0, n_index: 1})
    await expect(page.locator(".entries .list .teaser")).toHaveCount(1)
    await expect.soft(
      page.locator(".entries .list .teaser .text.ai"),
      ai_text_bug
    ).toHaveCount(0)
    await expect(page.locator(".entries .insights .summarize .no-result")).toHaveCount(1)
  })

  // test('summary', async () => {
  //   await page.locator(".appbar .button-journal").click()
  //   await expect(page.locator('.entry-teaser')).toHaveCount(2)
  // })
  // test('teaser', async () => {
  //   await page.locator(".entry-teaser").nth(0).click()
  // })
})

test("view", async ({page}) => {
  const utils = new Utils(page)
  await utils.addEntries({n_summarize: 1, n_index: 0})
})

// test("Basics", async ({page}) => {
//   // const browser = await chromium.launch({ headless: false, slowMo: 100 })
//   // const page = await browser.newPage()

//   const utils = new Utils(page)
//   const auth = await utils.signup()
//   console.log({auth})
//   await utils.addNoAiTag()
//   await utils.addEntries({n_summarize: 1, n_index: 1})
//   await page.locator(".appbar .button-journal").click()
//   await expect(page.locator('.entry-teaser')).toHaveCount(1)
// })


// test.only("Many entries", async ({page}) => {
//   // const browser = await chromium.launch({ headless: false, slowMo: 100 })
//   // const page = await browser.newPage()

//   const utils = new Utils(page)
//   const auth = await utils.signup()
//   console.log({auth})
//   await utils.addNoAiTag()
//   await utils.addEntries({n_summarize: 20, n_index: 0})
//   await page.locator(".appbar .button-journal").click()
//   await expect(page.locator('.entry-teaser')).toHaveCount(1)
// })
