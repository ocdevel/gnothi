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
// const someEntries = mockEntries.filter(e => (
//   ~["cbt_0", "cbt_1", "cbt_2", "ai_0", "ai_1"]
// ))
const someEntries = mockEntries
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
  await page.goto(`${URL}/?redirect=false`)

  // await expect(page.locator(".entry-teaser")).toHaveCount(0)
  // await page.locator(".toolbar-button").click()

  await page.locator(".button-tags-edit").click()
  await page.locator(".textfield-tags-post input").fill("SkipAI")
  await page.locator(".button-tags-post").click()
  const tagRow = await page.locator(".form-tags-put").nth(1)
  await tagRow.locator(".checkbox-tags-ai-summarize").click()
  // Actually let's keep indexing enabled for tests, it's fast. It's summarize that's slow
  // await tagRow.locator(".checkbox-tags-ai-index").click()
  await page.locator(".button-dialog-close").click()

  // Right now Main is selected, but not SkipAI. Add one entry through main,
  // to ensure that summary works. Then add the rest through SkipAI to speed things up
  async function addEntry({title, text}: {title: string, text: string}) {
    await page.getByLabel("Title").fill(title)
    await page.locator(".rc-md-editor textarea").fill(text)
    await page.locator(".button-entries-upsert").click()
  }
  await addEntry(someEntries[0])
  // now swap tags
  await page.locator(".button-tags-tag").nth(0).click()
  await page.waitForTimeout(6000) // summary takes a while, indexing is faster
  await page.locator(".button-tags-tag").nth(1).click()
  for (const entry of someEntries.slice(1)) {
    await addEntry(entry)
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
