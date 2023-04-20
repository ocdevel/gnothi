import {test, expect, chromium} from '@playwright/test'
import type {Page} from '@playwright/test' 


// @ts-ignore
import {Utils} from './utils.ts'

const selectorDash = '.insights .behaviors .dashboard'
const selectorModal = '.behaviors.modal'
const sel = {
  dash: {
    root: selectorDash,
    item: `${selectorDash} .behavior`,
    btn: `${selectorDash} .btn-expand`
  },
  modal: {
    root: selectorModal,
    item: `${selectorModal} .behavior`,
    btnClose: `.button-dialog-close`,
    form: {
      name: `${selectorModal} .input-name input`,
      typeSelect: `${selectorModal} .type-select`,
      typeOption: (type: string) => `.type-select-${type}`, // NOTE: dropdown mounted outside modal, don't use root selector
      btnSave: `${selectorModal} .btn-save`,
      btnDelete: `${selectorModal} .btn-delete`
    }
  },
}

type Behavior = {name: string, type: "number" | "fivestar" | "check"}
const behaviors: Behavior[] = [
  {name: "Number Field", type: "number"},
  {name: "Fivestar Field", type: "fivestar"},
  {name: "Checkbox Field", type: "check"},
]

type AddBehavior = Behavior & {
  page: Page,
  days?: number
}
async function addBehaviorsAndEntries({
  page,
  name,
  type,
  days=0,
}: AddBehavior) {
  await page.locator(sel.modal.form.name).fill(name)
  await page.locator(sel.modal.form.typeSelect).click()
  await page.locator(sel.modal.form.typeOption(type)).click() 
  //await page.locator(".fields.modal .input-default_value_value input").fill("3")
  await page.locator(sel.modal.form.btnSave).click()
}

test.describe("Behaviors", () => {
  test.describe("Fields", () => {
    test("CRUD", async ({page}) => {
      const utils = new Utils(page)
      await utils.signup()
  
      // Nothing yet
      await expect(page.locator(sel.dash.item)).toHaveCount(0)
      await page.locator(sel.dash.btn).click()
      await expect(page.locator(sel.modal.item)).toHaveCount(0)
  
      // Add first behavior
      await addBehaviorsAndEntries({page, ...behaviors[0]})
      await expect(page.locator(sel.modal.item)).toHaveCount(1)
      // Add second
      await addBehaviorsAndEntries({page, ...behaviors[1]})
      await expect(page.locator(sel.modal.item)).toHaveCount(2)
  
      const getItem = (n: number) => page.locator(sel.modal.item).nth(n)
  
      // Sanity-check
      await expect.soft(getItem(0)).toHaveText(behaviors[0].name)
      await expect.soft(getItem(1)).toHaveText(behaviors[1].name)
  
      // Update the first
      const updated = "Updated"
      await getItem(0).click()
      await expect.soft(sel.modal.form.name).toContain(behaviors[0].name)
      await page.locator(sel.modal.form.name).fill(updated)
      await page.locator(sel.modal.form.btnSave).click()
      await expect.soft(getItem(0)).toHaveText(updated)
      await expect.soft(getItem(1)).toHaveText(behaviors[1].name)
  
      // Delete the second
      await getItem(1).click()
      page.on('dialog', dialog => dialog.accept());
      await page.locator(sel.modal.form.btnDelete).click()
      await expect.soft(page.locator(sel.modal.item)).toHaveCount(1)
      await expect.soft(page.locator(sel.modal.item).nth(0)).toHaveText(updated)
  
      // Close the modal and check that the dashboard has the results too
      await page.locator(sel.modal.btnClose).click()
      await expect(page.locator(sel.dash.item)).toHaveCount(1)
      await expect(page.locator(sel.dash.item).nth(0)).toHaveText(updated)
    })
  
    test.fixme("Different field-types", () => {})
    test.fixme("Different different default_value types", () => {
      // for (let fieldType of ['select-number', 'select-fivestar', 'select-checkbox'])
    })
  
    test.fixme("crud from Entry.Create", () => {})
    test.fixme("crud from Entry.Update", () => {})
  
    test.fixme("Can't CRUD while snooping", () => {})
  })


  test.describe("FieldEntries", () => {
    test("CRUD", async ({page}) => {
      const utils = new Utils(page)
      await utils.signup()
  
      await page.locator(sel.dash.btn).click()
  
      // Add all behaviors
      for (let behavior of behaviors) {
        await addBehaviorsAndEntries({page, ...behavior})
      }
      
      const getItem = (n: number) => page.locator(sel.modal.item).nth(n)

      await expect.soft(page.locator(sel.modal.form.name)).toBeEmpty()
  
      await page.pause()
    })
    test.fixme("Delete Field removes FieldEntries", () => {
      // delete fields removes FE - how to check DB? maybe check API directly?
    })

    test.fixme("habitica", () => {})
    test.fixme("influencers", () => {})
    test.fixme("excluded", () => {})
  })  
})
