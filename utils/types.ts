type interactiveItemType = {
    index: number
    tag: string
    text: string
    role: string | null
    type: string | null
    ariaLabel: string | null
    href: string | null
    id: string 
    classNames: any
}

export type interactiveItemsRawObjectType = {
    pageUrl: string
    interactiveItems: interactiveItemType[]
}

export type interactiveItemsRawObjectJSONType = {
    generatedAt: string
    pages: interactiveItemsRawObjectType[]
}

export type classifiedInteractiveItemType = interactiveItemType & {
    pageUrl: string
    category: "internal-link" | "external-link" | "normal-button" | "navigation-button" | null
}

export type classifiedInteractiveItemJSONType = {
    generatedAt: string
    classifiedItems: classifiedInteractiveItemType[]
}

export type samePageItemsRecordType = {
    pageUrl: string
    itemName: string
    href?: string
}
