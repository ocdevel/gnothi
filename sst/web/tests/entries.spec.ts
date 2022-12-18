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
  await page.getByText("Dashboard").click()
  await expect(page.locator('.entry-teaser')).toHaveCount(1)
})


test("Many entries", async ({page}) => {
  // const browser = await chromium.launch({ headless: false, slowMo: 100 })
  // const page = await browser.newPage()

  const utils = new Utils(page)
  const auth = await utils.signup()
  console.log({auth})
  await utils.addNoAiTag()
  await utils.addEntries({n_summarize: 2, n_index: 20})
  await page.getByText("Dashboard").click()
  await expect(page.locator('.entry-teaser')).toHaveCount(1)
})
