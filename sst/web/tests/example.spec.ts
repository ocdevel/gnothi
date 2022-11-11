import {test, expect, chromium} from '@playwright/test'
import type {Page} from '@playwright/test'
import { ulid } from 'ulid'

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
  await page.goto('http://localhost:3000/?register=true')
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Gnothi/)

  const auth = genAuth()
  await page.getByText("Create Account").click()
  await page.getByText("Email").fill(auth.email)
  await page.getByText("Password", {exact: true}).fill(auth.pass)
  await page.getByText("Confirm Password", {exact: true}).fill(auth.pass)
  await page.locator("button[type=submit]").click()
  await expect(page).toHaveTitle(/Entries/)
  return auth
}

test('Create entry', async ({page}) => {
  // const browser = await chromium.launch({ headless: false, slowMo: 100 })
  // const page = await browser.newPage()

  const auth = await register(page)
  await expect(page.locator(".entry-teaser")).toHaveCount(0)

  await page.locator(".toolbar-button").click()
  await page.locator(".rc-md-editor textarea").fill(`Cognitive behavioral therapy (CBT) is a psycho-social intervention that aims to reduce symptoms of various mental health conditions, primarily depression and anxiety disorders.[3] CBT focuses on challenging and changing cognitive distortions (such as thoughts, beliefs, and attitudes) and their associated behaviors to improve emotional regulation and develop personal coping strategies that target solving current problems. Though it was originally designed to treat depression, its uses have been expanded to include the treatment of many mental health conditions, including anxiety, substance use disorders, marital problems, and eating disorders. CBT includes a number of cognitive or behavioral psychotherapies that treat defined psychopathologies using evidence-based techniques and strategies.`)

  await page.pause()

  // create a locator

  // await expect(
  //   page.locator('.entry-teaser')
  // )
});
