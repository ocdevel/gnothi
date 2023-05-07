import { expect } from '@playwright/test';
import type {Page} from "@playwright/test"
import {readFileSync} from "fs";
import {ulid} from "ulid";
import type {Events} from "@gnothi/schemas/events";

const URL = 'http://localhost:5173'
// const URL = 'https://d345r2wooxhdr2.cloudfront.net'

const mockEntriesFile = readFileSync("tests/mock_entries.json", {encoding: "utf-8"})
const mockEntries = JSON.parse(mockEntriesFile).map(e => ({
  // remove unwanted fields like id/user_id/created_at
  title: e.title,
  text: e.text,
}))

type CatchWs = {
  log?: boolean
  debug?: boolean
  once?: boolean
}

export class Utils {
  page: Page
  auth: {email: string, pass: string}
  entries: any[]
  tags: Record<string, string> = {} // {noai: <uuid>}
  wsListeners: {[k in Events]?: (v: unknown) => void} // resolvers

  constructor(page: Page) {
    this.page = page
    this.entries = []
    this.wsListeners = {}
    this.listenWebsockets()
  }

  async navigate(url: string) {
    await this.page.evaluate(() => {
      window.history.pushState('', '', url);
    });
  }

  async signup() {
    if (this.auth?.email) { return }

    const page = this.page
    await page.goto(`${URL}/?testing=true`)
    await expect(page).toHaveTitle(/Gnothi/)

    const mainTagP = this.catchWs("tags_list_response", {log: false})

    const auth = {email: `${ulid()}@x.com`, pass: "MyPassword!1"}
    await page.locator(".appbar .cta-primary").click() // signup
    // await page.getByText("Create Account").click()
    await page.getByText("Email").fill(auth.email)
    await page.getByText("Password", {exact: true}).fill(auth.pass)
    await page.getByText("Confirm Password", {exact: true}).fill(auth.pass)
    await page.locator("button[type=submit]").click()
    // TODO catchWs("tags_list_response") to save Main UUID
    // await expect(page).toHaveTitle(/New Entry/)
    this.auth = auth
    console.log({auth})
    this.tags.main = (await mainTagP).data[0].id
    return auth
  }

  async addNoAiTag() {
    if (this.tags?.noai) { return }
    await this.signup()
    const tagsPostP = this.catchWs("tags_post_response")
    const page = this.page
    await page.locator(".entries .tags .btn-edit").click()
    await page.locator(".textfield-tags-post input").fill("No AI")
    await page.locator(".btn-tags-post").click()
    this.tags["noai"] = (await tagsPostP).data[0].id
    const tagRow = await page.locator(".form-tags-put").nth(1)
    await tagRow.locator(".checkbox-tags-ai-summarize").click()
    // Actually let's keep indexing enabled for tests, it's fast. It's summarize that's slow
    // await tagRow.locator(".checkbox-tags-ai-index").click()
    await page.locator(".btn-dialog-close").click()
  }

  async _addEntry(title, text, noai=false) {
    const page = this.page
    await page.locator(".appbar .cta-primary").click()
    await page.getByLabel("Title").fill(title)
    await page.locator(".rc-md-editor textarea").fill(text)
    if (noai) {
      // Swap tags
      await page.locator(".entries.modal .upsert .form-upsert .tags .btn-select").nth(0).click()
      await page.locator(".entries.modal .upsert .form-upsert .tags .btn-select").nth(1).click()
    }
    await page.locator(".entries.modal .upsert .btn-submit").click()
  }

  async addEntries({n_summarize=0, n_index=0}: {n_summarize: number, n_index: number}) {
    await this.addNoAiTag()
    const page = this.page

    // FIXME how to redirect without loosing stuff? https://github.com/microsoft/playwright/issues/15889
    // await this.navigate('/?redirect=false')

    // Right now Main is selected, but not SkipAI. Add x entries through main,
    // to ensure that summary works. Then add the rest through SkipAI to speed things up
    let buffer = mockEntries.slice()
    n_summarize = n_summarize === -1 ? mockEntries.length : n_summarize
    for (let i = 0; i < n_summarize; i++) {
      const entry = buffer[0]
      buffer = buffer.slice(1)
      this.entries.push(entry)
      await this._addEntry(entry.title, entry.text)
      await page.waitForTimeout(5000) // summary takes a while
    }

    // then index the rest
    // take only what's left, based on their n_index
    let remaining = mockEntries.length - this.entries.length
    if (n_index === -1 || n_index > remaining) {
      n_index = remaining
    } // else n_index stays as-is
    for (let i = 0; i < n_index; i++) {
      const entry = buffer[0]
      buffer = buffer.slice(1)
      this.entries.push(entry)
      await this._addEntry(entry.title, entry.text, true)
      await page.waitForTimeout(500) // indexing is faster
    }
  }

  listenWebsockets() {
    this.page.on("console", (message) => {
      if (message.type() === "error") {
        console.log(message.text())
      }
    })

    const catchWs = async ({payload}: {payload: string | Buffer}) => {
      const data = JSON.parse(payload as string)
      this.wsListeners[data.event]?.(data)
    }

    this.page.on('websocket', ws => {
      console.log(`WebSocket opened: ${ws.url()}>`)
      ws.on('framesent', catchWs)
      ws.on('framereceived', catchWs)
      ws.on('close', () => console.log('WebSocket closed'));
    })
  }

  async catchWs(event: Events, opts: CatchWs = {}) {
    const {log, once, debug} = {log: true, once: true, debug: false, ...opts}
    // 1. initialize promise
    return new Promise((resolve, reject) => {
      this.wsListeners[event] = resolve
    // 2. It's resolved in listenWebsockets#ws.on(framereceived)
    }).then((data) => {
      // 3. Final transformer and return
      if (log) {
        console.log(data)
        // debugger
      }
      if (once) {
        this.wsListeners[event] = undefined
      } else {
        // set new listener. Can't resolve multiple times
        new Promise(resolve => {this.wsListeners[event] = resolve})
      }
      return data
    })
  }

}
