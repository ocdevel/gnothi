import {test, expect, chromium} from '@playwright/test'
import type {Page} from '@playwright/test' 
// @ts-ignore
import {Utils} from './utils.ts'

test.describe("Notes", () => {
  test("Crud", async ({page}) => {
    await (new Utils(page)).addEntries({n_summarize: 0, n_index: 1})
    await page.locator(".entries .list .teaser").nth(0).click()
  })
  test.fixme("Shows up under entry.view", () => {})
  test.fixme("Other use can view, if shared", () => {})
  test.describe("multiple notes", () => {})
  test.fixme("listed in chronological order", () => {})
})
  