import {test, expect, chromium} from '@playwright/test'
import type {Page} from '@playwright/test' 
// @ts-ignore
import {sel, Utils} from './utils.ts'
import {ulid} from "ulid";

test("Subscribes to premium", async ({page, context}) => {
  await (new Utils(page)).addEntry()
  await page.locator(sel.appbar.close).click()
  await page.locator(sel.appbar.btnProfile).click()
  await page.locator(sel.appbar.btnPremium).click()
  await page.locator(sel.premium.btnUpgrade).click()
  const stripePage = await context.waitForEvent('page');
  await stripePage.locator('input[name="email"]').fill(`${ulid()}@x.com`)
  await stripePage.locator('input[name="cardNumber"]').fill("4242424242424242")
  await stripePage.locator('input[name="cardExpiry"]').fill("1225")
  await stripePage.locator('input[name="cardCvc"]').fill("123")
  await stripePage.locator('input[name="billingName"]').fill("Test User")
  await stripePage.locator('input[name="billingPostalCode"]').fill("12345")
  await stripePage.locator('input[name="enableStripePass"]').uncheck()
  await stripePage.locator('button[type="submit"]').click()
  // TODO do stuff in Stripe page
  await expect(page.locator(sel.premium.btnUpgrade)).not.toBeVisible()
  await page.pause()
})