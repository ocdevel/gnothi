import {test, expect, chromium} from '@playwright/test'
import type {Page} from '@playwright/test' 

// @ts-ignore
import {Utils} from './utils.ts'
import { templateSettings } from 'lodash'
// test("x", async ({page, browser}) => {
//   const browser = await chromium.launch({ headless: false, slowMo: 100 })
//   const page = await browser.newPage()
// })

async function startDraft(page: Page) {
  await page.locator(sel.appbar.close).click()
  await page.locator(sel.appbar.cta).click()
  
  await page.locator(sel.entries.create.title).fill("Draft Title")
  await page.locator(sel.entries.create.text).fill("Draft Text")
  await page.waitForTimeout(1500)
  //await page.locator(".entries.modal .upsert .form-upsert .tags .btn-select").nth(1).click()
  await utils.navigate("/")
  await page.locator(sel.appbar.cta).click()
  await expect(page.locator(sel.entries.create.title)).toHaveValue("Draft Title")
  await expect(page.locator(sel.entries.create.text)).toHaveValue("Draft Text")
}

test.describe("Entries", () => {
  test.describe('CRUD', () => {
    // create accounted for everywhere
    test("view", async ({page}) => {
      await (new Utils(page)).addEntries({n_summarize: 0, n_index: 1})
      await expect(page.locator(".entries.modal .view .text")).not.toBeEmpty()
    })
    test("update", async ({page}) => {
      const utils = new Utils(page)
      await utils.addEntries({n_summarize: 0, n_index: 1})
      await page.locator(".entries.modal .view .btn-edit").click()
      await page.locator(".entries.modal .upsert .editor textarea").fill("Updated content")
      await page.locator(".entries.modal .upsert .btn-submit").click()
      await expect(page.locator(".entries .list .teaser .text")).toContainText("Updated content")
    })
    test("delete", async ({page}) => {
      const utils = new Utils(page)
      await utils.addEntries({n_summarize: 0, n_index: 1})
      
      await page.locator(".entries.modal .view .btn-edit").click()
      page.on('dialog', dialog => dialog.accept());
      await page.locator(".entries.modal .upsert .btn-delete").click()
      await expect.soft(page.locator(".entries.modal")).not.toBeVisible()
      await expect(page.locator(".entries .list .teaser")).toHaveCount(0)
    })
  })

  test.describe("Drafts", () => {
    test("New entry, refresh page", async({page}) => {
      const utils = new Utils(page)
      // just adding an entry here to kick things off, like registration, tags, etc. Won't be used until Exsting Entry tests
      await utils.addEntries({n_summarize: 0, n_index: 1})
      const {sel} = utils

      await page.locator(sel.appbar.close).click()
      await utils._addEntry({title: "Draft Title", text: "Draft Text", submit: false})
      await utils.navigate("/") // refresh
      await page.locator(sel.appbar.cta).click()
      await expect(page.locator(sel.entries.create.title)).toHaveValue("Draft Title")
      await expect(page.locator(sel.entries.create.text)).toHaveValue("Draft Text")
    })
    test("New entry, X button", async ({page}) => {
      const utils = new Utils(page)
      await utils.addEntries({n_summarize: 0, n_index: 1})
      const {sel} = utils

      await page.locator(utils.sel.appbar.close).click()
      await utils._addEntry({title: "Draft Title", text: "Draft Text", submit: false})
      await page.locator(utils.sel.appbar.close).click()
      await page.locator(sel.appbar.cta).click()
      await expect(page.locator(sel.entries.create.title)).toHaveValue("Draft Title")
      await expect(page.locator(sel.entries.create.text)).toHaveValue("Draft Text")
    })
    test("Existing, refresh page", async({page}) => {
      const utils = new Utils(page)
      await utils.addEntries({n_summarize: 0, n_index: 1})
      const {sel} = utils

      await page.locator(sel.appbar.close).click()
      await page.locator('.entries .list .teaser').nth(0).click()
      await page.locator('.entries.modal .btn-edit').click()
      await page.locator(sel.entries.create.text).fill("Draft Text")
      await utils.navigate("/")

      await page.locator('.entries .list .teaser').nth(0).click()
      await page.locator('.entries.modal .btn-edit').click()
      await expect(page.locator(sel.entries.create.title)).toHaveValue("Draft Title")
      await expect(page.locator(sel.entries.create.text)).toHaveValue("Draft Text")
    })
    test("Existing entry, X button", async ({page}) => {
      const utils = new Utils(page)
      await utils.addEntries({n_summarize: 0, n_index: 1}) // this time, this entry counts
      const {sel} = utils

      await page.locator(sel.appbar.close).click()
      await page.locator('.entries .list .teaser').nth(0).click()
      await page.locator('.entries.modal .btn-edit').click()
      await page.locator(sel.entries.create.text).fill("Draft Text")
      await page.locator(sel.appbar.close).click()

      await page.locator('.entries .list .teaser').nth(0).click()
      await page.locator('.entries.modal .btn-edit').click()
      await expect(page.locator(sel.entries.create.title)).not.toHaveValue("Draft Title")
      await expect(page.locator(sel.entries.create.text)).not.toHaveValue("Draft Text")
    })
  })
  
  test.describe("edge cases", () => {
    test.fixme("manually set date", async () => {})
    test.fixme("update/delete should handle s3 files too", async () => {})
  })

  const ai_text_bug = "FIXME - ai_text is being set to entry plaintext, meaning I can't test if is-ai (for the mouse-hover about-summary)."

  test.fixme("search", () => {})

  test.fixme("close modal shows insights afterwards", () => {})
  
  test.describe("summaries", () => {
    test("sum:1 index:1", async ({page}) => {
      const utils = new Utils(page)
      await utils.addEntries({n_summarize: 1, n_index: 1})
  
      await expect(
        page.locator(".entries .list .teaser"),
        "Both entries show in list"
      ).toHaveCount(2)
  
      await expect(
        page.locator(".entries .list .teaser .text.ai"),
        ai_text_bug
      ).toHaveCount(1)
  
      await expect(
        page.locator(".entries .insights .summarize .result"),
        "Sidebar summary has a result (from the entry with summary enabled)"
      ).toHaveCount(1)
  
      
      await expect(page.locator(".entries .view .insights .summarize .result")).toHaveCount(1)
    })
    test("sum:0 index:1", async ({page}) => {
      const utils = new Utils(page)
      await utils.addEntries({n_summarize: 0, n_index: 1})
      await expect(page.locator(".entries .list .teaser")).toHaveCount(1)
      await expect.soft(
        page.locator(".entries .list .teaser .text.ai"),
        ai_text_bug
      ).toHaveCount(0)
      await expect(page.locator(".entries .insights .summarize .no-result")).toHaveCount(1)
    })

    test.fixme("if no_ai, modal summary should be invisible. Themes should be just keywords", () => {})
  })
  
  test.describe("index", () => {
    test.fixme("no-index, no-summarize shouldn't show anything in sidebar, nor generate summary for entry", () => {})
  })
})