import {test, expect, chromium} from '@playwright/test'
import type {Page} from '@playwright/test' 

// @ts-ignore
import {Utils} from './utils.ts'


test.describe("@entries - one each", () => {
  // const browser = await chromium.launch({ headless: false, slowMo: 100 })
  // const page = await browser.newPage()

  let page: Page;
  let utils: Utils
  test.beforeAll(async ({browser}) => {
    page = await browser.newPage()
    utils = new Utils(page)
    const auth = await utils.signup()
    console.log({auth})
    await utils.addNoAiTag()
    await utils.addEntries({n_summarize: 1, n_index: 1})
  })

  test.afterAll(async () => {
    await page.close()
  })

  test("summary,index created",async () => {
    await expect(page.locator(".entry-teaser")).toHaveCount(2)
  })

  test('summary', async () => {
    await page.locator(".appbar .button-journal").click()
    await expect(page.locator('.entry-teaser')).toHaveCount(2)
    expect(true).toBe(false)
  })
  test('teaser', async () => {
    await page.locator(".entry-teaser").nth(0).click()
    console.log('hi')
  })
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
