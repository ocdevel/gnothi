import {test, expect, chromium} from '@playwright/test'
import type {Page} from '@playwright/test' 

// @ts-ignore
import {Utils} from './utils.ts'
// test("x", async ({page, browser}) => {
//   const browser = await chromium.launch({ headless: false, slowMo: 100 })
//   const page = await browser.newPage()
// })

test.describe("Entries", () => {
  test.describe('CRUD', () => {
    // create accounted for everywhere
    test("view", async ({page}) => {
      await (new Utils(page)).addEntries({n_summarize: 0, n_index: 1})
      await page.locator(".entries .list .teaser").nth(0).click()
      await expect(page.locator(".entries.modal .view .title")).toHaveCount(1)
    })
    test("update", async ({page}) => {
      const utils = new Utils(page)
      await utils.addEntries({n_summarize: 0, n_index: 1})
      await page.locator(".entries .list .teaser").nth(0).click()
      await page.locator(".entries.modal .view .btn-edit").click()
      await page.locator(".entries.modal .upsert .editor textarea").fill("Updated content")
      await page.locator(".entries.modal .upsert .btn-submit").click()
      await expect(page.locator(".entries .list .teaser .text")).toContainText("Updated content")
    })
    test("delete", async ({page}) => {
      const utils = new Utils(page)
      await utils.addEntries({n_summarize: 0, n_index: 1})
      await page.locator(".entries .list .teaser").nth(0).click()
      await page.locator(".entries.modal .view .btn-edit").click()
      page.on('dialog', dialog => dialog.accept());
      await page.locator(".entries.modal .upsert .btn-delete").click()
      await expect.soft(page.locator(".entries.modal")).not.toBeVisible()
      await expect(page.locator(".entries .list .teaser")).toHaveCount(0)
    })
  })
  
  test.describe("edge cases", () => {
    test.fixme("manually set date", async () => {})
    test.fixme("update/delete should handle s3 files too", async () => {})
  })

  const ai_text_bug = "FIXME - ai_text is being set to entry plaintext, meaning I can't test if is-ai (for the mouse-hover about-summary)."

  test.fixme("search", () => {})
  
  test.describe("summaries", () => {
    test("sum:1 index:1", async ({page}) => {
      const utils = new Utils(page)
      await utils.addEntries({n_summarize: 1, n_index: 1})
  
      await expect(
        page.locator(".entries .list .teaser"),
        "Both entries show in list"
      ).toHaveCount(2)
  
      await expect.soft(
        page.locator(".entries .list .teaser .text.ai"),
        ai_text_bug
      ).toHaveCount(1)
  
      await expect(
        page.locator(".entries .insights .summarize .result"),
        "Sidebar summary has a result (from the entry with summary enabled)"
      ).toHaveCount(1)
  
      await page.locator(".entries .list .teaser").nth(0).click()
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
  })
  
  test.describe("index", () => {
    test.fixme("no-index, no-summarize shouldn't show anything in sidebar, nor generate summary for entry", () => {})
  })
})

test.describe("Notes", () => {
  test.fixme("Crud", () => {})
  test.fixme("Shows up under entry.view", () => {})
  test.fixme("Other use can view, if shared", () => {})
  test.describe("multiple notes", () => {
    test.fixme("listed in chronological order", () => {})

  })
})
