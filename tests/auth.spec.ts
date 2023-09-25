import {test, expect, chromium} from '@playwright/test'
import type {Page} from '@playwright/test' 

// @ts-ignore
import {Utils} from './utils.ts'

test("Creates a main tag", async ({page}) => {
  const utils = new Utils(page)
  const auth = await utils.signup()
  await expect(page.locator('.entries .list .tags .btn-select.selected')).toHaveCount(1)
})

test.fixme("agreement checkboxes", () => {})