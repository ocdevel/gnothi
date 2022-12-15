import {test, expect, chromium} from '@playwright/test'
import type {Page} from '@playwright/test'
import { ulid } from 'ulid'
import {readFileSync} from 'fs'

const URL = 'http://localhost:3000'

const mockEntriesFile = readFileSync("tests/mock_entries.json", {encoding: "utf-8"})
const mockEntries = JSON.parse(mockEntriesFile).map(e => ({
  // remove unwanted fields like id/user_id/created_at
  title: e.title,
  text: e.text,
}))
// console.log(mockEntries)
const someEntries = mockEntries.filter(e => (
  ~["cbt_0", "cbt_1", "cbt_2", "ai_0", "ai_1"]
))
const nEntries = someEntries.length

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
  await page.goto(URL)
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Gnothi/)

  const auth = genAuth()
  await page.locator(".button-show-signup").click()
  // await page.getByText("Create Account").click()
  await page.getByText("Email").fill(auth.email)
  await page.getByText("Password", {exact: true}).fill(auth.pass)
  await page.getByText("Confirm Password", {exact: true}).fill(auth.pass)
  await page.locator("button[type=submit]").click()
  await expect(page).toHaveTitle(/New Entry/)
  return auth
}

test("Setup user", async ({page}) => {
  // const browser = await chromium.launch({ headless: false, slowMo: 100 })
  // const page = await browser.newPage()

  const auth = await register(page)
  console.log({auth})
  // await page.goto(`${URL}/?redirect=false`)

  // await expect(page.locator(".entry-teaser")).toHaveCount(0)
  // await page.locator(".toolbar-button").click()

  await page.locator(".button-tags-edit").click()
  await page.locator(".textfield-tags-post input").fill("Skip AI")
  await page.locator(".button-tags-post").click()
  const tagRow = await page.locator(".form-tags-put").nth(1)
  await tagRow.locator(".checkbox-tags-ai-summarize").click()
  await tagRow.locator(".checkbox-tags-ai-index").click()

  return

  for (const entry of someEntries) {
    await page.getByLabel("Title").fill(entry.title)
    await page.locator(".rc-md-editor textarea").fill(entry.text)
    await page.getByRole("button", {name: "Submit"}).click()
    await page.waitForTimeout(6000)
  }

  await page.getByText("Dashboard").click()
  await expect(page.locator('.entry-teaser')).toHaveCount(nEntries)

  await page.waitForTimeout(10000)
  //const path = await page.video().path();



  // create a locator

  // await expect(
  //   page.locator('.entry-teaser')
  // )
});
