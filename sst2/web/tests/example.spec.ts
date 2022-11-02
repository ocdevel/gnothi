import { test, expect } from '@playwright/test';

test('smoke test', async ({ page }) => {
  page.on("console", (message) => {
    if (message.type() === "error") {
      console.log(message.text())
    }
  })

  await page.goto('http://localhost:3000/')

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Gnothi/)

  await page.locator("id=button-show-auth").click()

  // create a locator
  await expect(page).toHaveTitle(/Gnothi/)
});
