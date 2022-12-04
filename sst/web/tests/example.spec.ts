import {test, expect, chromium} from '@playwright/test'
import type {Page} from '@playwright/test'
import { ulid } from 'ulid'
import {readFileSync} from 'fs'

const URL = 'http://localhost:3000'

const mockEntriesFile = readFileSync("tests/mock_entries.json", {encoding: "utf-8"})
const mockEntries = JSON.parse(mockEntriesFile)
// console.log(mockEntries)

type Auth = {email: string, pass: string}
const genAuth = () => ({email: `${ulid()}@x.com`, pass: "MyPassword!1"})

test.beforeEach(async ({page}) => {
  page.on("console", (message) => {
    if (message.type() === "error") {
      console.log(message.text())
    }
  })
  page.on('websocket', ws => {
    console.log(`WebSocket opened: ${ws.url()}>`);
    ws.on('framesent', event => console.log(event.payload));
    ws.on('framereceived', event => console.log(event.payload));
    ws.on('close', () => console.log('WebSocket closed'));
  });
})

async function register(page: Page): Promise<Auth> {
  await page.goto(`${URL}/?register=true`)
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Gnothi/)

  const auth = genAuth()
  await page.getByText("Create Account").click()
  await page.getByText("Email").fill(auth.email)
  await page.getByText("Password", {exact: true}).fill(auth.pass)
  await page.getByText("Confirm Password", {exact: true}).fill(auth.pass)
  await page.locator("button[type=submit]").click()
  await expect(page).toHaveTitle(/New Entry/)
  return auth
}

test('Create entry', async ({page}) => {
  // const browser = await chromium.launch({ headless: false, slowMo: 100 })
  // const page = await browser.newPage()

  const auth = await register(page)
  // await page.goto(`${URL}/?redirect=false`)

  // await expect(page.locator(".entry-teaser")).toHaveCount(0)
  // await page.locator(".toolbar-button").click()

  console.log({auth})
  const nEntries = 3
  for (const entry of mockEntries.slice(0, nEntries)) {
    await page.getByLabel("Title").fill(entry.title)
    await page.locator(".rc-md-editor textarea").fill(entry.text)
    await page.getByRole("button", {name: "Submit"}).click()
    await page.waitForTimeout(6000)
  }

  await page.getByText("Analyze").click()
  await expect(page.locator('.entry-teaser')).toHaveCount(nEntries)

  await page.waitForTimeout(10000)

  // create a locator

  // await expect(
  //   page.locator('.entry-teaser')
  // )
});
