import {test, expect, chromium} from '@playwright/test'
import type {Page} from '@playwright/test' 
// @ts-ignore
import {Utils} from './utils.ts'
import _ from 'lodash'

const rootSel = ".entries.modal .view"
type NoteType = "label" | "resource" | "note" 
const sel = {
  list: `${rootSel} .notes.list`,
  btnAdd: (noteType: NoteType) => `${rootSel} .btn-add-${noteType}`,
  create: `${rootSel} .notes .create #textfield-text`,
  listItem: `${rootSel} .notes.list .note`,
  btnSubmit: `${rootSel} .notes .create .btn-submit`,
}

test.describe("Notes", () => {
  test.describe("Crud", () => {
    test("Create", async ({page}) => {
      await (new Utils(page)).addEntries({n_summarize: 0, n_index: 1})

      let i = 0
      async function addThing(noteType: NoteType) {
        await page.locator(sel.btnAdd(noteType)).click()
        await page.locator(sel.create).fill(`This is a ${noteType}`)
        await page.locator(sel.btnSubmit).click()
        // check the note type in the header thingy
        await expect.soft(
          page.locator(`${sel.listItem} .text`).nth(i)
        ).toContainText(`This is a ${noteType}`)
        await expect.soft(
          page.locator(sel.listItem).nth(i).locator('.type')
        ).toContainText(_.startCase(noteType))
        i = i + 1
      }

      await expect(page.locator(sel.listItem)).toHaveCount(0)
      await addThing("note")
      await expect(page.locator(sel.listItem)).toHaveCount(1)
      await addThing("resource")
      await expect(page.locator(sel.listItem)).toHaveCount(2)
      await addThing("label")
      await expect(page.locator(sel.listItem)).toHaveCount(3)

    })
    test.fixme("Update", ({page}) => {})
    test.fixme("Delete", async ({page}) => {})
  })
  
  test.fixme("Other user can view, if shared", () => {})

})
  