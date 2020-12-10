const puppeteer = require('puppeteer');
const levenshtein = require('js-levenshtein');
/*const browser = await puppeteer.launch({
    headless:false,
    slowMo:100
});*/

// prices xpath
//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[7]/div/span/div/div/div[4]/div/div/div/a/span[1]/span[2]/span[2]
//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[6]/div/span/div/div/div[4]/div/div/div/a/span[1]/span[2]/span[2]

// product names xpath
//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[14]/div/span/div/div/div[2]/h2/a/span
//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[15]/div/span/div/div/div[2]/h2/a/span

//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[6]/div/span/div/div/div/span/a/div/img - prime 
//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[10]/div/span/div/div/span/a/div/img
//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[14]/div/span/div/div/span/a/div/img
//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[7]/div/span/div/div/span/a/div/img - pantry
//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[12]/div/span/div/div/span/a/div/img - pantry

async function scrapeAmazonPrices(searchString,count){
    let url = 'https://www.amazon.in';
    let product_name_xpath_template = '//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[##]/div/span/div/div/div[2]/h2/a/span';
    let product_price_xpath_template = '//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[##]/div/span/div/div/div[4]/div/div/div/a/span[1]/span[2]/span[2]';
    let product_image_xpath_template = '//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[##]/div/span/div/div/span/a/div/img';
    let num_results = count;
    let query = searchString;
    let products = [];
    let output = { products: [], closestToQuery: {} };

    console.log("Launching browser...")
    const browser = await puppeteer.launch();
    console.log("Opening new page...");
    const page = await browser.newPage();
    
    console.log("Navigating to url...");
    await page.goto(url);
    console.log("Entering query...");
    await page.type("#twotabsearchtextbox", query);

    const searchBtn = await page.$x('//*[@id="nav-search-submit-text"]/input');
    console.log("Clicking on search...");
    searchBtn[0].click();

    console.log("Waiting for page to load...");
    await page.waitForNavigation()
    console.log("Waiting for results to load...");
    await page.waitForXPath("/html/body/div[1]/div[2]/div[1]/div[2]");
    
    console.log("Populating output list...");
    // Get prices and names from Amazon
    for(let i=0;i<num_results;i++){
        let product_name_xpath = product_name_xpath_template.replace("##",i);
        let product_price_xpath = product_price_xpath_template.replace("##",i);
        let product_image_xpath = product_image_xpath_template.replace("##",i);
        let product_info = {
            product_name: "",
            product_price: "",
            product_image: ""
        };
        
        const [product_name] = await page.$x(product_name_xpath);
        const [product_price] = await page.$x(product_price_xpath);
        const [product_image] = await page.$x(product_image_xpath);

        if(product_name){
            let content = await product_name.getProperty('textContent')
            let text  = await content.jsonValue();
            product_info.product_name = text;
        }
        if(product_price){
            let content = await product_price.getProperty('textContent')
            let text  = await content.jsonValue();
            product_info.product_price = text;
        }
        if(product_image){
            let content = await product_image.getProperty('src')
            let text  = await content.jsonValue();
            product_info.product_image = text;
        }

        if(product_info.product_name !== "" && product_info.product_price !== "" && product_info.product_image){
            products.push(product_info);
        }
    }
    // Get product closest to query 
    let distances = products.map((product,index) => {
        return {
            index: index,
            distance: levenshtein(query,product.product_name)
        }
    });
    let minDistance = distances[0].distance;
    let minIndex = distances[0].index;
    for(let i=0;i<distances.length;i++){
        if(distances[i].distance < minDistance){
            minDistance = distances[i].distance;
            minIndex = distances[i].index;
        }
    }
    let minDistanceProduct = products[minIndex];

    output.products = products;
    output.closestToQuery = minDistanceProduct;
    
    console.log(`${products.length} products found`);
    console.log("Finished populating output \n");

    return output;
}

module.exports = scrapeAmazonPrices;

(async () => {
    let query = "solimo choco flakes";
    let max_products = 200;

    console.log("Search query: ",query);
    console.log("Max products: ",max_products);

    let output = await scrapeAmazonPrices(query,max_products);

    for(let product of output.products){
        console.log("Product name: ",product.product_name);
        console.log("Product price: Rs",product.product_price);
        console.log("Product image url: ",product.product_image);
        console.log("\n");
    }
    console.log("Product closest to search query: ",output.closestToQuery);
    console.log("END");
})();

