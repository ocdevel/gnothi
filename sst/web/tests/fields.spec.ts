import {test, expect, chromium} from '@playwright/test'
import type {Page} from '@playwright/test' 


// @ts-ignore
import {Utils} from './utils.ts'

async function addBehaviorsAndEntries({
  page,
  name,
  type,
  days=0,
}: {
  page: Page,
  name: string,
  type: "number" | "fivestar" | "checkbox",
  days?: number
}) {
  await page.locator(".behaviors.modal .input-name input").fill(name)
  await page.locator(".behaviors.modal .type-select").click()
  await page.locator(`.type-select-${type}`).click() // dropdown mounted outside modal
  //await page.locator(".fields.modal .input-default_value_value input").fill("3")
  await page.locator(".behaviors.modal .btn-save").click()
}

test.describe("fields", () => {
  test.describe("crud", () => {
    test("create", async ({page}) => {
      const utils = new Utils(page)
      await utils.signup()
      await expect(page.locator('.insights .behaviors .dashboard .behavior')).toHaveCount(0)
      await page.locator(".insights .behaviors .dashboard .btn-expand").click()
      await addBehaviorsAndEntries({page, name: "field1", type: "fivestar"})
      await expect(page.locator(".insights .fields .field")).toHaveCount(1)
    })
  })
})

test("Add field", async ({page}) => {
  const utils = new Utils(page)
  const auth = await utils.signup()
  await expect(page.locator('.insights .fields .field')).toHaveCount(0)

  for (let fieldType of ['select-number', 'select-fivestar', 'select-checkbox']) {
    
  }

  
})

// FIXME
// crud fields
// crud FE
// delete fields removes FE - how to check DB? maybe check API directly?