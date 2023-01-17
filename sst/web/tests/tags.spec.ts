import {test, expect} from '@playwright/test'
import type {Page} from "@playwright/test"

// @ts-ignore
import {Utils} from './utils.ts'

async function createTag(page: Page, keepopen=false) {
  const utils = new Utils(page)
  const auth = await utils.signup()
  await page.locator(".button-tags-edit").click()
  await page.locator(".textfield-tags-post input").fill("New Tag")
  await page.locator(".button-tags-post").click()

  if (!keepopen) {
    await page.locator(".button-dialog-close").click()
  }

  return utils
}

test("Creates tag, clears form", async ({page}) => {
  const utils = await createTag(page, true)

  await expect(page.locator('.form-tags-put .textfield-tags-name input').nth(1)).toHaveValue("New Tag")
  await expect(page.locator(".textfield-tags-post input")).toBeEmpty()
})

test.only("Filter on tags", async ({page}) => {
  // TODO use manually-specified tag. Need to update Utils()
  // const utils = await createTag(page)
  const utils = new Utils(page)
  await utils.signup()
  await utils.addNoAiTag()

  // add 1 & 2, so we can delineate
  await utils.addEntries({n_summarize: 1, n_index: 2})

  // initially all tags selected, all entries shown
  await expect(page.locator(".entry-teaser")).toHaveCount(3)

  // de-select Main, only shows other 2
  const toggle1P = utils.catchRes("tags_toggle_response")
  await page.locator(".button-tags-tag").nth(0).click()
  const toggle1 = await toggle1P
  expect(toggle1.data[0].name).toBe("Main")
  expect(toggle1.data[0].selected).toBe(false)
  await expect(page.locator(".entry-teaser")).toHaveCount(2)

  await page.locator(".button-tags-tag").nth(1).click()
  await expect(page.locator(".entry-teaser")).toHaveCount(0)
  await page.locator(".button-tags-tag").nth(0).click()
  await expect(page.locator(".entry-teaser")).toHaveCount(1)
})
