import {test, expect, chromium} from '@playwright/test'
import type {Page} from '@playwright/test' 


// @ts-ignore
import {Utils} from './utils.ts'

const selectorModal = '.sharing.modal'
const sel = {
  modal: {
    root: selectorModal,
    item: `${selectorModal} .share`,
    btnClose: `.button-dialog-close`,
    form: {
      email: `${selectorModal} .input-email input`,
      btnSave: `${selectorModal} .btn-save`,
      btnDelete: `${selectorModal} .btn-delete`
    }
  },
}

type AddShare = {
  page: Page,
  email: string
}
async function addShare({
  page,
  email,
}: AddShare) {
  await page.locator(sel.modal.form.email).fill(email)
  await page.locator(sel.modal.form.btnSave).click()
}

test.describe("Sharing", () => {
    test("CRUD", async ({page}) => {
      const utils = new Utils(page)
      await utils.signup()
  
      // Nothing yet
      await page.locator('.btn-sharing').click()
      await expect(page.locator(sel.modal.item)).toHaveCount(0)
  
      // Add first behavior
      await addShare({page, email: "x@y.com"})
      await expect(page.locator(sel.modal.item)).toHaveCount(1)
      
      const getItem = (n: number) => page.locator(sel.modal.item).nth(n)
  
    })  
})
