# How to run test?
1. run npm run install(inside the terminal) to install all the necessary dependencies in the package.json

# Step 1: run crawler
run npm run crawl. You will see Crawling: + the website url inside your terminal. Wait until the crawl process end. You can now find website-interactive-items.json under your data folder.

# Step 2: run classifier
run npm run classify. You can now find classified-website-interactive-items.json under your data folder.

# Step 3: run test
1. You can run single test files in given browser use command: npm run + script (You can find them in package.json scripts part e.g.: npm run internal-links-test-chrome)

2. You can run test in UI mode use command: npm run test-ui.
