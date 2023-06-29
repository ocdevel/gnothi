import {test, expect, chromium} from '@playwright/test'
import type {Page} from '@playwright/test' 

// @ts-ignore
import {sel, Utils} from './utils.ts'
import { templateSettings } from 'lodash'
// test("x", async ({page, browser}) => {
//   const browser = await chromium.launch({ headless: false, slowMo: 100 })
//   const page = await browser.newPage()
// })

test.describe("Entries", () => {
  test.describe('CRUD', () => {
    // create accounted for everywhere
    test("view", async ({page}) => {
      await (new Utils(page)).addEntry()
      await expect(page.locator(sel.entries.view.text)).not.toBeEmpty()
      await page.locator(sel.appbar.close).click()
      await expect(page.locator(sel.entries.list.text)).toHaveCount(1)
      
    })
    test("update", async ({page}) => {
      const utils = new Utils(page)
      await utils.addEntry()
      await page.locator(sel.entries.view.btnEdit).click()
      const content = "Updated content"
      await page.locator(sel.entries.upsert.form.text).fill(content)
      await page.locator(sel.entries.upsert.form.submit).click()
      await expect(page.locator(sel.entries.view.text)).toContainText(content)
      await page.locator(sel.appbar.close).click()
      await expect(page.locator(sel.entries.list.text).nth(0)).toContainText(content)
    })
    test("delete", async ({page}) => {
      const utils = new Utils(page)
      await utils.addEntry()
      
      await page.locator(sel.entries.view.btnEdit).click()
      page.on('dialog', dialog => dialog.accept());
      await page.locator(sel.entries.upsert.btnDelete).click()
      await expect.soft(page.locator(sel.entries.upsert.base)).not.toBeVisible()
      await expect(page.locator(sel.entries.list.teaser)).toHaveCount(0)
    })
  })

  test.describe.skip("Drafts", () => {
    test("New entry, refresh page", async({page}) => {
      const utils = new Utils(page)
      // just adding an entry here to kick things off, like registration, tags, etc. Won't be used until Exsting Entry tests
      await utils.addEntries({n_summarize: 0, n_index: 1})

      await page.locator(sel.appbar.close).click()
      await utils._addEntry({title: "Draft Title", text: "Draft Text", submit: false})
      await utils.navigate("/") // refresh
      await page.locator(sel.appbar.cta).click()
      await expect(page.locator(sel.entries.upsert.form.title)).toHaveValue("Draft Title")
      await expect(page.locator(sel.entries.upsert.form.text)).toHaveValue("Draft Text")
    })
    test("New entry, X button", async ({page}) => {
      const utils = new Utils(page)
      await utils.addEntries({n_summarize: 0, n_index: 1})

      await page.locator(sel.appbar.close).click()
      await utils._addEntry({title: "Draft Title", text: "Draft Text", submit: false})
      await page.locator(sel.appbar.close).click()
      await page.locator(sel.appbar.cta).click()
      await expect(page.locator(sel.entries.upsert.form.title)).toHaveValue("Draft Title")
      await expect(page.locator(sel.entries.upsert.form.text)).toHaveValue("Draft Text")
    })
    test("Existing, refresh page", async({page}) => {
      const utils = new Utils(page)
      await utils.addEntries({n_summarize: 0, n_index: 1})

      await page.locator(sel.appbar.close).click()
      await page.locator('.entries .list .teaser').nth(0).click()
      await page.locator('.entries.modal .btn-edit').click()
      await page.locator(sel.entries.upsert.form.text).fill("Draft Text")
      await utils.navigate("/")

      await page.locator('.entries .list .teaser').nth(0).click()
      await page.locator('.entries.modal .btn-edit').click()
      await expect(page.locator(sel.entries.upsert.form.title)).toHaveValue("Draft Title")
      await expect(page.locator(sel.entries.upsert.form.text)).toHaveValue("Draft Text")
    })
    test("Existing entry, X button", async ({page}) => {
      const utils = new Utils(page)
      await utils.addEntries({n_summarize: 0, n_index: 1}) // this time, this entry counts

      await page.locator(sel.appbar.close).click()
      await page.locator('.entries .list .teaser').nth(0).click()
      await page.locator('.entries.modal .btn-edit').click()
      await page.locator(sel.entries.upsert.form.text).fill("Draft Text")
      await page.locator(sel.appbar.close).click()

      await page.locator('.entries .list .teaser').nth(0).click()
      await page.locator('.entries.modal .btn-edit').click()
      await expect(page.locator(sel.entries.upsert.form.title)).not.toHaveValue("Draft Title")
      await expect(page.locator(sel.entries.upsert.form.text)).not.toHaveValue("Draft Text")
    })
  })
  
  test.describe("edge cases", () => {
    test.fixme("manually set date", async () => {})
    test.fixme("update/delete should handle s3 files too", async () => {})
  })

  test.fixme("search", () => {})

  test.fixme("close modal shows insights afterwards", () => {})
})