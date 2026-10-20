import { PlaywrightCrawler } from "crawlee";
import crypto from 'crypto';
import { writeFileSync } from "fs"
import { interactiveItemsRawObjectType } from "../utils/types"
import path from "node:path"


const allInteractiveItemsByPagesArray: interactiveItemsRawObjectType[] = []

const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 1000,
    async requestHandler({request, page, enqueueLinks, log}){
        const requestUrl = request.url
        log.info(`Crawling: ${requestUrl}`);
        // locate all interactive items and record them
        const interactiveItems = await page.locator(
            `
            a,
            button,
            [role="button"],
            [role="link"],
            [role="tab"],
            [role="menuitem"]
            `
        ).evaluateAll((elements) => 
            elements.map((element, index) => ({
                index,
                tag: element.tagName,
                text: element.textContent.trim(),
                role: element.getAttribute("role"),
                type: element.getAttribute("type"),
                ariaLabel: element.getAttribute("aria-label"),
                href: (element as HTMLAnchorElement).href || null,
                // index will change each time running crawler, so give each item an unique and solid ID
                id: element.id,
                classNames: element.className
            }))
        )
        
        // only keep the items that will be tested later.
        const interactiveItemsFiltered = interactiveItems.filter(item => {
            // ignore submit or map marker button
            if((item.tag === "BUTTON" && (item.type === "submit" || item.text === "↺ Reset"))
                ||
               (item.tag === "DIV" && item.ariaLabel === "Map marker") 
               // only crawl menu items(desktop and mobile) once(crawl them on the homepage and omit them on the other pages)
               ||   
               (requestUrl !== "https://strategyandops.net/" && (item.role === "menuitem" || item.classNames.includes("ct-menu-link") || item.ariaLabel === "Left Menu Button" || item.ariaLabel === "Expand dropdown menu"))
               ||
               // only crawl footer links once(crawl them on the homepage and omit them on the other pages)
               (requestUrl !== "https://strategyandops.net/" && (item.ariaLabel === "footer-social-media-links" || item.ariaLabel === "footer-contact"))
               ||
               // only crawl copy links & social media share buttons once(crawl them on one post and omit them on the other posts)
               (requestUrl !== "https://strategyandops.net/sustainable-data-centres-powering-ai-without-compromising-our-energy-future/" && item.classNames.includes("social-sharing-icon"))
               ||
               // only crawl sign in & search button once(crawl them on the homepage and omit them on the other pages)
               (requestUrl !== "https://strategyandops.net/" && (item.text === "Sign In" || item.text === "Search" || item.ariaLabel === "Close search modal"))
               ||
               (requestUrl !== "https://strategyandops.net/" && (item.text === "Skip to content" || item.classNames.includes("headertext") || item.ariaLabel === "Go to top"))
               ||
               // omit translator
               (item.classNames.includes("nturl"))
               ||
               (item.text === "Continue shopping")
               ||
               // checkout link and <- back button
               (requestUrl !== "https://strategyandops.net/sustainability-training-institute/?add-to-cart=12926" && item.text === "Proceed to checkout")
               ||
               (requestUrl !== "https://strategyandops.net/contact/" && item.text === "← Back")
               // avoid duplicated remove button
               ||
               (requestUrl.startsWith("https://strategyandops.net/courses-cart/?remove_item") && item.classNames.includes("remove"))
               ||
               (item.href && !item.href.startsWith("https"))
            ){
                return false
            }

            return true
        })
        
        const interactiveItemsWithHashID = interactiveItemsFiltered.map((item) => ({
            ...item,
            id: item.id || crypto.createHash("sha256").update(`${requestUrl}${item.tag}${item.text}`).digest("hex"),
        }))
        
        // all interactive items in one page
        const interactiveItemsRawObject = {
            pageUrl: requestUrl,
            interactiveItems: interactiveItemsWithHashID
        }

        allInteractiveItemsByPagesArray.push(interactiveItemsRawObject)
        // continue crawling internal pages
        await enqueueLinks({
            strategy: "same-origin"
        })

    }
})

await crawler.run([
    "https://strategyandops.net/"
])

//store all interactive items Object in a JSON file under data folder 
const allInteractiveItemsByPagesArrayRawObject = {
    generatedAt: new Date().toLocaleString(),
    pages: allInteractiveItemsByPagesArray
}


const filePath = path.join(process.env.WEBSITE_INTERACTIVE_ITEMS_DATA_FOLDER || "./data", "website-interactive-items.json")

writeFileSync(filePath, JSON.stringify(allInteractiveItemsByPagesArrayRawObject, null, 2))