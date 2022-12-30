import {test, expect, chromium} from '@playwright/test'

// @ts-ignore
import {Utils} from './utils.ts'


test.only("Creates tag, clears form", async ({page}) => {
  const utils = new Utils(page)
  const auth = await utils.signup()
  await page.locator(".button-tags-edit").click()
  await page.locator(".textfield-tags-post input").fill("New Tag")
  await page.locator(".button-tags-post").click()

  await expect(page.locator('.form-tags-put .textfield-tags-name input').nth(1)).toHaveValue("New Tag")
  await expect(page.locator(".textfield-tags-post input")).toBeEmpty()
})
