import {test, expect, chromium} from '@playwright/test'
import type {Page} from '@playwright/test' 

// @ts-ignore
import {Utils} from './utils.ts'
import { templateSettings } from 'lodash'

const ai_text_bug = "FIXME - ai_text is being set to entry plaintext, meaning I can't test if is-ai (for the mouse-hover about-summary)."

test.describe("Insights", () => {
  test("smoke test some entries", async ({page}) => {
    const utils = new Utils(page)
    await utils.addEntries({n_summarize: 3, n_index: 3})
  })

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