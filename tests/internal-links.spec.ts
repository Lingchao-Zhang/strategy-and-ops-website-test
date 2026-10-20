import { test, expect } from '@playwright/test';
import fs from "node:fs/promises"
import { classifiedInteractiveItemJSONType, samePageItemsRecordType } from "../utils/types"
const filePath = "./data/classified-website-interactive-items.json"
// read classified tested items(internal links only)
const JSONString = await fs.readFile(filePath, "utf8")
const classifiedItemsJSON = JSON.parse(JSONString) as classifiedInteractiveItemJSONType
const classifiedItemsArray = classifiedItemsJSON.classifiedItems.filter(item => item.category === "internal-link")

// record the pageUrl, name and href, no need to test repeatedly
const sameLinksHrefsPageItemRecord: samePageItemsRecordType[] = []

// test index
let textIndex = 0
// use for loop to test all internal links
for (const classifiedItem of classifiedItemsArray){
    const { pageUrl, text: itemText, href: itemHref } = classifiedItem
    const itemsCheckObject = { pageUrl, itemName: itemText, href: itemHref || "" }
    const testName = `${textIndex}-${itemText}`
    test(`${testName} navigation`, async({ page }) => {
        if(itemHref && !sameLinksHrefsPageItemRecord.includes(itemsCheckObject)){
            // go to the page where the item is located before navigation test
            await page.goto(classifiedItem.pageUrl);
            
            // locate the item first and then click
            // use text + href double filter to distinguish the links that have the same name but different href
            const testItem = page.locator(`a[href="${itemHref}"]`).filter({ hasText: `/^${itemText}$/`})
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
                sameLinksHrefsPageItemRecord.push({
                    pageUrl,
                    itemName: itemText,
                    href: itemHref
                })
            }
        }
    })
    textIndex++
}