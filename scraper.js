const puppeteer = require('puppeteer');
const string_similarity = require('./Utils/similarity_score');
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

//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[##]/div/span/div/div/div[2]/div[2]/div/div[1]/div/div/div[1]/h2/a/span
//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[3]/div/span/div/div/div[2]/div[2]/div/div[1]/div/div/div[1]/h2/a/span

//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[6]/div/span/div/div/div/span/a/div/img - prime 
//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[10]/div/span/div/div/span/a/div/img
//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[14]/div/span/div/div/span/a/div/img
//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[12]/div/span/div/div/span/a/div/img - pantry

async function scrapeAmazonPrices(searchString,count,scraperType='household_items'){
    let url = 'https://www.amazon.in';
    const xpaths = {
        product_name_xpath: {
            default: '//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[##]/div/span/div/div/div[2]/h2/a/span',
            alt: '//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[##]/div/span/div/div/div[2]/div[2]/div/div[1]/div/div/div[1]/h2/a/span'
        },
        product_price_xpath: {
            default: '//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[##]/div/span/div/div/div[4]/div/div/div/a/span[1]/span[2]/span[2]',
            alt: '//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[##]/div/span/div/div/div[2]/div[2]/div/div[2]/div[1]/div/div[1]/div[1]/div/div/a/span[1]/span[2]/span[2]'
        },
        product_image_xpath: {
            default: '//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[##]/div/span/div/div/span/a/div/img',
            alt:    '//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[##]/div/span/div/div/div[2]/div[1]/div/div/span/a/div/img'
        }
    }
    let search_results_xpath = "/html/body/div[1]/div[2]/div[1]/div[2]";
    let search_input_box_selector = "#twotabsearchtextbox";
    let search_button_xpath = '//*[@id="nav-search-submit-text"]/input';
    let num_results = count;
    let query = searchString;
    let products = [];
    let output = { products: [], bestMatch: {} };

    try{
        console.log("Launching browser...")
        const browser = await puppeteer.launch();
        console.log("Opening new page...");
        const page = await browser.newPage();
        
        console.log("Navigating to url...");
        await page.goto(url);

        console.log("Entering query...");
        await page.type(search_input_box_selector, query);

        console.log("Clicking on search...");
        const searchBtn = await page.$x(search_button_xpath);
        searchBtn[0].click();
        
        console.log("Waiting for page to load...");
        await page.waitForNavigation()

        console.log("Waiting for results to load...");
        await page.waitForXPath(search_results_xpath);
        
        console.log("Populating output list...");
        for(let i=0;i<num_results;i++){
            let product_name_xpath = xpaths.product_name_xpath.default.replace("##",i);
            let product_price_xpath = xpaths.product_price_xpath.default.replace("##",i);
            let product_image_xpath = xpaths.product_image_xpath.default.replace("##",i);
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
            else{
                console.log("Using alt xpath");
                let product_name_xpath = xpaths.product_name_xpath.alt.replace("##",i);
                const [product_name] = await page.$x(product_name_xpath);
                if(product_name){
                    let content = await product_name.getProperty('textContent');
                    let text  = await content.jsonValue();
                    product_info.product_name = text;
                }
            }

            if(product_price){
                let content = await product_price.getProperty('textContent')
                let text  = await content.jsonValue();
                product_info.product_price = text;
            }
            else{
                console.log("Using alt xpath");
                let product_price_xpath = xpaths.product_price_xpath.alt.replace("##",i);
                const [product_price] = await page.$x(product_price_xpath);
                if(product_price){
                    let content = await product_price.getProperty('textContent');
                    let text  = await content.jsonValue();
                    product_info.product_price = text;
                }
            }

            if(product_image){
                let content = await product_image.getProperty('src')
                let text  = await content.jsonValue();
                product_info.product_image = text;
            }
            else{
                console.log("Using alt xpath");
                let product_image_xpath = xpaths.product_image_xpath.alt.replace("##",i);
                const [product_image] = await page.$x(product_image_xpath);
                if(product_image){
                    let content = await product_image.getProperty('src');
                    let text  = await content.jsonValue();
                    product_info.product_image = text;
                }
            }
            console.log(product_info);

            if(product_info.product_name !== "" && product_info.product_price !== "" && product_info.product_image){
                products.push(product_info);
            }
        }
        console.log(`${products.length} products found`);

        let similarity_scores = products.map((product,index) => {
            return {
                product_index: index,
                similarity: string_similarity(query,product.product_name)
            }
        });
        let max_similar_product = products[0];
        let max_score = similarity_scores[0].similarity;
        similarity_scores.forEach(score => {
            if(score.similarity > max_score){
                max_score = score.similarity;
                max_similar_product = products[score.product_index];
            }
        })

        output.products = products;
        output.bestMatch = max_similar_product;
        console.log("Finished populating output \n");
    }
    catch(error){
        console.log(error);
    }
    finally{
        return output;
    }
}
module.exports = scrapeAmazonPrices;

/*(async () => {
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
})();*/

