import {test, expect, chromium} from '@playwright/test'

// @ts-ignore
import {Utils} from './utils.ts'


test("Add field", async ({page}) => {
  const utils = new Utils(page)
  const auth = await utils.signup()
  await expect(page.locator('.insights .fields .field')).toHaveCount(0)

  // Add all 3
  await page.locator(".insights .fields .btn-new").click()
  await page.locator(".fields.modal .input-name input").fill("Field1")
  await page.locator(".type-select").click()
  await page.locator(".type-select-number").click()
  await page.locator(".fields.modal .input-default_value_value input").fill("3")
  await page.locator(".fields.modal .btn-save").click()
  await expect(page.locator(".insights .fields .field")).toHaveCount(1)
})
