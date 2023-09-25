import {test, expect, chromium} from '@playwright/test'
import type {Page} from '@playwright/test' 
// @ts-ignore
import {sel, Utils} from './utils.ts'
import {ulid} from "ulid";

test("Subscribes to premium", async ({page, context}) => {
  const utils = new Utils(page, context)
  await utils.addEntry()
  await utils.upgradeAccount()
  
  // TODO do stuff in Stripe page
  await expect(page.locator(sel.premium.btnUpgrade)).not.toBeVisible()
  await page.pause()
})