import { test, expect } from '@playwright/test';
import { LMSCoursesLinks } from "../data/LMS-courses-links"

for(const coursePage of LMSCoursesLinks){
    test.describe(`${coursePage.pageUrl} links test`, () => {
        const courseLinks = coursePage.links
        for(let i = 0; i < courseLinks.length; i++){
            const courseLink = courseLinks[i]
            test(`${i}-${courseLink.name} test`, async ({request, page}) => {
                const courseLinkHref = courseLink.href
                const response = await request.get(courseLinkHref, {
                    timeout: 15000,
                    maxRedirects: 10,
                });
                const responseStatus = response.status()
                console.log(responseStatus)
                if(responseStatus < 400){
                    expect(
                        responseStatus,
                        `response from ${courseLinkHref}`
                    ).toBeLessThan(400); 
                } else if(responseStatus === 404 || responseStatus === 410){
                    expect(
                        responseStatus,
                        `Unexpected response from ${courseLinkHref}`
                    ).toBeLessThan(400); 
                } else {
                    
                    await page.goto(courseLinkHref, { waitUntil: "domcontentloaded", timeout: 20000 })
                    expect(page).toHaveURL(courseLinkHref)
                }
            })
        }
    })
}