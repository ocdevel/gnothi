import {test, expect, chromium} from '@playwright/test'

// @ts-ignore
import {Utils} from './utils.ts'


test("Add field", async ({page}) => {
  const utils = new Utils(page)
  const auth = await utils.signup()
  await expect(page.locator('.fields-field')).toHaveCount(0)

  // Add all 3
  await page.locator(".button-fields-field-new").click()
  await page.locator(".input-fields-field-name input").fill("Field1")
  await page.locator(".type-select").click()
  await page.locator(".type-select-number").click()
  await page.locator(".input-fields-field-default_value_value input").fill("3")
  await page.locator(".button-fields-field-post").click()
  await expect(page.locator(".fields-field")).toHaveCount(1)
})
