import { expect } from '@playwright/test';
import type {Page, BrowserContext} from "@playwright/test"
import {readFileSync} from "fs";
import {ulid} from "ulid";
import type {Events} from "@gnothi/schemas/events";

const URL = 'http://localhost:5173'
// const URL = 'https://d345r2wooxhdr2.cloudfront.net'

export const sel = {
  appbar: {
    close: '.btn-dialog-close',
    cta: '.appbar .cta-primary',
    btnProfile: '.appbar .usermenu .btn-profile',
    btnPremium: '.btn-premium', // TODO have more specific selector, having trouble with .appbar .usermenu .btn-premium,
    creditBanner: {
      base: '.appbar .credit-banner',
      nCredits: '.appbar .credit-banner .n-credits',
      timer: '.appbar .credit-banner .timer'
    }
  },
  tags: {
    input: ".textfield-tags-post input",
    submit: ".btn-tags-post"
  },
  entries: {
    list: {
      teaser: ".entries .list .teaser",
      text: '.entries .list .teaser .text',
      textAi: '.entries .list .teaser .text.ai',
      addTag: ".entries .tags .btn-edit"
    },
    view: {
      base: '.entries.modal .view',
      text: ".entries.modal .view .text",
      btnEdit: ".entries.modal .view .btn-edit"
    },
    upsert: {
      base: ".entries.modal .upsert",
      tags: ".entries.modal .upsert .form-upsert .tags .btn-select",
      btnDelete: ".entries.modal .upsert .btn-delete",
      form: {
        title: '.entries.modal .upsert .textfield-title input',
        text: '.rc-md-editor textarea', //".entries.modal .upsert .editor textarea"
        submit: ".entries.modal .upsert .btn-submit"
      }
    }
  },
  premium: {
    btnUpgrade: ".premium.modal .btn-upgrade"
  },
  insights: {
    summarize: {
      result: ".insights .summarize .result",
      resultNone: ".insights .summarize .result.none",
      resultAi: ".insights .summarize .result.ai",
      btnUseCredit: ".insights .summarize .btn-use-credit",
    },
    books: {
      book: ".insights .books .book"
    }
  }
}

const mockEntriesFile = readFileSync("./tests/mock_entries.json", {encoding: "utf-8"})
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
  context?: BrowserContext
  auth: {email: string, pass: string}
  entries: any[]
  tags: Record<string, string> = {} // {noai: <uuid>}
  wsListeners: {[k in Events]?: (v: unknown) => void} // resolvers

  constructor(page: Page, context?: BrowserContext) {
    this.page = page
    this.context = context
    this.entries = []
    this.wsListeners = {}
    this.listenWebsockets()
  }

  async navigate(path: string) {
    await this.page.goto(`${URL}${path}`)
    // await this.page.evaluate(() => {
    //   window.history.pushState('', '', url);
    // });
  }

  async signup() {
    if (this.auth?.email) { return }

    const page = this.page
    await page.goto(`${URL}/?testing=true`)
    await expect(page).toHaveTitle(/Gnothi/)

    const mainTagP = this.catchWs("tags_list_response", {log: false})

    const auth = {email: `${ulid()}@x.com`, pass: "MyPassword!1"}
    await page.locator(".appbar .cta-secondary").click() // signup
    await page.locator(".checkbox-acceptTermsConditionsDisclaimerPrivacyPolicy").click()
    await page.locator(".btn-next").click()
    // await page.getByText("Create Account").click()
    
    const selRegister = "form[data-amplify-authenticator-signup]"
    await page.locator(`${selRegister} input[name="email"]`).fill(auth.email)
    await page.locator(`${selRegister} input[name="password"]`).fill(auth.pass)
    await page.locator(`${selRegister} input[name="confirm_password"]`).fill(auth.pass)
    await page.locator(`${selRegister} button[type=submit]`).click()
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
    await page.locator(sel.entries.list.addTag).click()
    await page.locator(sel.tags.input).fill("No AI")
    await page.locator(sel.tags.submit).click()
    this.tags["noai"] = (await tagsPostP).data[0].id
    const tagRow = await page.locator(".form-tags-put").nth(1)
    await tagRow.locator(".checkbox-tags-ai-summarize").click()
    // Actually let's keep indexing enabled for tests, it's fast. It's summarize that's slow
    // await tagRow.locator(".checkbox-tags-ai-index").click()
    await page.locator(sel.appbar.close).click()
  }

  async _addEntry({title, text, noai=false, submit=true}: {title: string, text: string, noai?: boolean, submit?: boolean}) {
    const page = this.page
    await page.locator(sel.appbar.cta).click()
    await page.locator(sel.entries.upsert.form.title).fill(title)
    await page.locator(sel.entries.upsert.form.text).fill(text)
    if (noai) {
      // Swap tags
      await page.locator(sel.entries.upsert.tags).nth(0).click()
      await page.locator(sel.entries.upsert.tags).nth(1).click()
    }
    if (submit) {
      await page.locator(sel.entries.upsert.form.submit).click()
    } else {
      // intended as a draft. Give it a moment to save to localStorage
      await page.waitForTimeout(1000)
    }
  }

  async addEntry(summarize=false) {
    await this.addNoAiTag()
    const entry = mockEntries[0]
    await this._addEntry({title: entry.title, text: entry.text, noai: !summarize})
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
      await this._addEntry({title: entry.title, text: entry.text})
      // since we're redirection to view-modal, close it between addEntry
      // previously waiting for 5sec for summary to finish genearting. TODO not sure why?
      // Now waiting for 1 sec for entry_post_response to trigger view-modal, before we can close it
      await page.waitForTimeout(2000) 
      await page.locator(sel.appbar.close).click()
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
      await this._addEntry({title: entry.title, text: entry.text, noai: true})
      await page.locator(sel.appbar.close).click()
      await page.waitForTimeout(500) // indexing is faster
    }
  }

  async upgradeAccount() {
    const {page, context} = this
    if (!context) { throw new Error("context wasn't passed to `new Utils(page, context)`, required for upgradeAccount")}
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
