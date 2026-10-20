import { interactiveItemsRawObjectType, classifiedInteractiveItemType, interactiveItemsRawObjectJSONType } from "../utils/types"
import fs from "node:fs/promises"
import path from "node:path"


const filePath = path.join(process.env.WEBSITE_INTERACTIVE_ITEMS_DATA_FOLDER || "./data", "website-interactive-items.json")

// const websiteInteractiveItemsRawJSON = 
const itemsClassfier = (pagesArray: interactiveItemsRawObjectType[]) => {
    const classifiedItemsArray:classifiedInteractiveItemType[]  = []
    for(const page of pagesArray){
        // classfication logic
        const {pageUrl, interactiveItems} = page
        for(const item of interactiveItems){
            let classifiedItem: classifiedInteractiveItemType = {...item, pageUrl: "", category: null}
            // links
            if((item.href && (item.tag === "A" && item.role !== "button" && !item.classNames.includes("remove")) || item.role === "link")){
                // links case1: internal links
                if(item.href?.startsWith("https://strategyandops.net")){
                    classifiedItem = {...item, pageUrl, category: "internal-link"}
                }
                // links case2: external links
                else{
                    classifiedItem = {...item, pageUrl, category: "external-link"}
                }
            }
            
            // buttons
            // buttons case1: normal button (button without href)
            else if((item.tag === "BUTTON" || item.role === "button") && !item.href){
                classifiedItem = {...item, pageUrl, category: "normal-button"}
            }

            // buttons case2: navigation button (button with href)

            else if(((item.tag === "BUTTON" || item.role === "button") && item.href) || item.classNames.includes("remove")){
                classifiedItem = {...item, pageUrl, category: "navigation-button"}
            }
            classifiedItemsArray.push(classifiedItem)
    }
}
 return {"generatedAt": new Date().toLocaleString(), "classifiedItems": classifiedItemsArray} 
}

try{
    // read website-interactive-items json file
    const JSONString = await fs.readFile(filePath,"utf8")
    const websiteInteractiveItemsRawJSON = JSON.parse(JSONString) as interactiveItemsRawObjectJSONType
    const websiteInteractiveItemsPageArray = websiteInteractiveItemsRawJSON.pages

    // store all classified interactive items Object in a JSON file under data folder
    const classifiedItemsJSON = itemsClassfier(websiteInteractiveItemsPageArray)
    const storedFilePath = path.join(process.env.WEBSITE_INTERACTIVE_ITEMS_DATA_FOLDER || "./data", "classified-website-interactive-items.json")
    await fs.writeFile(storedFilePath, JSON.stringify(classifiedItemsJSON, null, 2))
    
} catch(error){
    console.error(error)
}
