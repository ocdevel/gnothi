import {test, expect, chromium} from '@playwright/test'

// @ts-ignore
import {Utils} from './utils.ts'


test("Basics", async ({page}) => {
  // const browser = await chromium.launch({ headless: false, slowMo: 100 })
  // const page = await browser.newPage()

  const utils = new Utils(page)
  const auth = await utils.signup()
  console.log({auth})
  await utils.addNoAiTag()
  await utils.addEntries({n_summarize: 1, n_index: 1})
  await page.locator(".appbar .button-journal").click()
  await expect(page.locator('.entry-teaser')).toHaveCount(1)
})


test.only("Many entries", async ({page}) => {
  // const browser = await chromium.launch({ headless: false, slowMo: 100 })
  // const page = await browser.newPage()

  const utils = new Utils(page)
  const auth = await utils.signup()
  console.log({auth})
  await utils.addNoAiTag()
  await utils.addEntries({n_summarize: 0, n_index: 10})
  await page.locator(".appbar .button-journal").click()
  await expect(page.locator('.entry-teaser')).toHaveCount(1)
})
