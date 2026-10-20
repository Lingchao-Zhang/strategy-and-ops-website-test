import { test, expect } from '@playwright/test';
import fs from "node:fs/promises"
import { classifiedInteractiveItemJSONType, samePageItemsRecordType } from "../utils/types"
const filePath = "./data/classified-website-interactive-items.json"
// read classified tested items(internal links only)
const JSONString = await fs.readFile(filePath, "utf8")
const classifiedItemsJSON = JSON.parse(JSONString) as classifiedInteractiveItemJSONType
const classifiedNavigationButtonsArray = classifiedItemsJSON.classifiedItems.filter(item => item.category === "navigation-button")
const classifiedNormalButtonsArray = classifiedItemsJSON.classifiedItems.filter(item => item.category === "normal-button")

// record the pageUrl, name and href, no need to test repeatedly
const samebuttonsPageItemRecord: samePageItemsRecordType[] = []

// test index
let textIndex = 0
// use for loop to test all navigation buttons
test.describe("navigation button test", () => {
for (const classifiedItem of classifiedNavigationButtonsArray){
    const { pageUrl, text: itemText, ariaLabel: itemariaLabel, href: itemHref } = classifiedItem
    const itemsCheckObject = { pageUrl, itemName: itemText === "" ? (itemariaLabel || "") : itemText, href: itemHref || "" }
    const itemsCheckObjectItemName = itemsCheckObject.itemName
    const testName = `${textIndex}-${itemsCheckObjectItemName}`
    test(`${testName} navigation`, async({ page }) => {
        if(itemHref && !samebuttonsPageItemRecord.includes(itemsCheckObject)){
            // go to the page where the item is located before navigation test
            await page.goto(classifiedItem.pageUrl);
            
            // locate the item first and then click
            // use text + href double filter to distinguish the buttons that have the same name but different href
            const testItem = page.locator(`a[href="${itemHref}"]`).filter({ hasText: `/^${itemsCheckObjectItemName}$/`})
            const testItemNumber = await testItem.count()
            // case1: unique name + same name links different href
            if(testItemNumber === 1){
                await testItem.click()
                // assert the directed page url with the right one
                await expect(page).toHaveURL(itemHref)
            } 
            
            // case2: same name links with same href
            else if(testItemNumber > 1){
                // use loop to test them all at once
                for(let i = 0; i < testItemNumber; i++){
                    const item = testItem.nth(i)
                    await item.click()
                    await page.goto(pageUrl)
                }

                // record the pageUrl, name and href, no need to test repeatedly
                samebuttonsPageItemRecord.push({
                    pageUrl,
                    itemName: itemsCheckObjectItemName,
                    href: itemHref
                })
            }
        }
    })
    textIndex++
}
})

// use for loop to test all normal buttons
test.describe("normal button generic test", () => {
for (const classifiedItem of classifiedNormalButtonsArray){
    const { pageUrl, text: itemText, ariaLabel: itemariaLabel } = classifiedItem
    const itemName = itemText === "" ? (itemariaLabel ? itemariaLabel : "") : itemText
    const testName = `${textIndex}-${itemName}`
    test(`${testName} navigation`, async({ page }) => {
        // go to the page where the item is located before navigation test
            await page.goto(classifiedItem.pageUrl);
            
            // locate the item first and then click
            // use text + href double filter to distinguish the buttons that have the same name but different href
            const testItem = page.getByRole("button", { name: itemName, exact: true })
            const testItemNumber = await testItem.count()
            // case1: unique name + same name links different href
            if(testItemNumber === 1){
                await expect(testItem).toBeVisible();
                await expect(testItem).toBeEnabled();
            } 
            
            // case2: same name links with same href
            else if(testItemNumber > 1){
                // use loop to test them all at once
                for(let i = 0; i < testItemNumber; i++){
                    await expect(testItem).toBeVisible();
                    await expect(testItem).toBeEnabled();
                }

                // record the pageUrl, name and href, no need to test repeatedly
                samebuttonsPageItemRecord.push({
                    pageUrl,
                    itemName
                })
            }
    })
    textIndex++
}
})


