import { test, expect } from '@playwright/test';
import fs from "node:fs/promises"
import { classifiedInteractiveItemJSONType } from "../utils/types"
const filePath = "./data/classified-website-interactive-items.json"
// read classified tested items(internal links only)
const JSONString = await fs.readFile(filePath, "utf8")
const classifiedItemsJSON = JSON.parse(JSONString) as classifiedInteractiveItemJSONType
const classifiedItemsArray = classifiedItemsJSON.classifiedItems.filter(item => item.category === "external-link")

/*
linkedIn has its own protective rules, and frequent request will lead to block/auth. 
There are a lot of linkedIn profile links inside the website,
so test them in batches individually
*/
const classifiedItemLinkedInArray = classifiedItemsArray.filter(item => item.href && item.href.includes("https://www.linkedin.com/"))
const classifiedItemOthersArray = classifiedItemsArray.filter(item => item.href && !item.href.includes("https://www.linkedin.com/"))
let textIndex = 0
// use for loop to test all internal links
test.describe("other external links test", () => { 
    for (const classifiedItem of classifiedItemOthersArray){
        const { pageUrl, href: itemHref } = classifiedItem
        const testName = `${textIndex}-${pageUrl}${itemHref}`
        test(`${testName} navigation`, async({ page, request }) => {
            if(itemHref){
                // go to the page where the item is located before navigation test
                await page.goto(classifiedItem.pageUrl);
                
                // use text + href double filter to distinguish the links that have the same name but different href
                const testItem = classifiedItem.ariaLabel === "Facebook" ? page.getByRole("link", {name: classifiedItem.ariaLabel, exact: true}) : page.locator(`a[href="${itemHref}"]`) 
                // external links can be impacted by kinds of factors
                // use HTTP request check first, and then fall back to browser navigation when necessary
                const response = await request.get(itemHref, {
                    timeout: 15000,
                    maxRedirects: 10,
                });
                const responseStatus = response.status()
                // some files and websites will block access from robot(resquest from automated test is in this case)
                // some websites or social media such as linkedIn will block frequent requests.
                /* 
                if a request get a 200(succeed) or 30X(redirect) response -> pass
                if a request get a 404(Not found) or 410(permanently gone/removed) response -> fail
                if a request get other responses like 403(access denied), 500-599(server-side error) -> further test to make conclusion
                further test: click the link -> check the url/title of the new Tab
                can be opened, url -> pass
                otherwise -> fail
                */ 
                if(responseStatus < 400){
                    expect(
                        responseStatus,
                        `response from ${itemHref}`
                    ).toBeLessThan(400); 
                } else if(responseStatus === 404 || responseStatus === 410){
                    expect(
                        responseStatus,
                        `Unexpected response from ${itemHref}`
                    ).toBeLessThan(400); 
                } else {
                    await testItem.scrollIntoViewIfNeeded();
                    await expect(testItem).toBeVisible();
    
                    const [newPage] = await Promise.all([
                        page.waitForEvent('popup'),
                        testItem.click(),
                    ]);
                    await newPage.waitForLoadState('domcontentloaded', {timeout: 20000});
    
                    await expect(newPage).toHaveURL(itemHref)
                    // needs extra specific check:
      
                    // youtube video link
                    if(itemHref.includes("www.youtube.com/watch")){
                        
                        // check whether the video is available or not
                        const [newPage] = await Promise.all([
                            page.waitForEvent('popup'),
                            testItem.click(),
                        ]);
                        await expect(newPage).not.toHaveTitle("")
                    }   
                }
    
                
            }
        })
        textIndex++
    }
})

textIndex = 0
test.describe("linkedIn links test", () => { 
    for (let i = 0; i < classifiedItemLinkedInArray.length; i++){
        const classifiedItem = classifiedItemLinkedInArray[i]
        const { pageUrl, href: itemHref } = classifiedItem
        const testName = `${textIndex}-${pageUrl}${itemHref}`
        test(`${testName} navigation`, async({ page, request }) => {
            if(itemHref){
                // go to the page where the item is located before navigation test
                await page.goto(classifiedItem.pageUrl);
                
                const testItem = page.locator(`a[href="${itemHref}"]`) 
                // external links can be impacted by kinds of factors
                // use HTTP request check first, and then fall back to browser navigation when necessary
                const response = await request.get(itemHref, {
                    timeout: 15000,
                    maxRedirects: 10,
                });
                const responseStatus = response.status()
                
                if(responseStatus < 400){
                    expect(
                        responseStatus,
                        `response from ${itemHref}`
                    ).toBeLessThan(400); 
                } else if(responseStatus === 404 || responseStatus === 410){
                    expect(
                        responseStatus,
                        `Unexpected response from ${itemHref}`
                    ).toBeLessThan(400); 
                } else {
                    await testItem.scrollIntoViewIfNeeded();
                    await expect(testItem).toBeVisible();
    
                    const [newPage] = await Promise.all([
                        page.waitForEvent('popup'),
                        testItem.click(),
                    ]);
                    await newPage.waitForLoadState('domcontentloaded', {timeout: 20000});

                    const allowedUrlResults = [
                        itemHref,
                        `${itemHref}/`
                    ]
                    await expect(newPage).toHaveURL(url => 
                        url.href.startsWith("https://www.linkedin.com/authwall") || allowedUrlResults.includes(url.href)
                    )
                }
    
                
            }
        })
        textIndex++
    }
})
