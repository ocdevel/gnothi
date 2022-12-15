import {test, expect, chromium} from '@playwright/test'
import type {Page} from '@playwright/test'
import { ulid } from 'ulid'

// @ts-ignore
import {Utils} from './utils.ts'


test("Setup user", async ({page}) => {
  // const browser = await chromium.launch({ headless: false, slowMo: 100 })
  // const page = await browser.newPage()

  const utils = new Utils(page)
  const auth = await utils.signup()
  console.log({auth})
  await utils.addNoAiTag()
  await utils.addEntries({n_summarize: 1, n_index: 2})
  await page.getByText("Dashboard").click()
  await expect(page.locator('.entry-teaser')).toHaveCount(3)
});
