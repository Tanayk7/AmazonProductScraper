const puppeteer = require('puppeteer');
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

function get_bigrams(string){
    let s = string.toLowerCase()
    let bigrams = [];
    for(let i=0; i < s.length - 1; i++)
    { 
        bigrams[i] = s.slice(i, i + 2); 
    }
    return bigrams;
}

function string_similarity(str1, str2){
    if(str1.length>0 && str2.length>0){
        let pairs1 = get_bigrams(str1);
        let pairs2 = get_bigrams(str2);
        let total_length = pairs1.length + pairs2.length;
        let hits = 0;

        for(let x=0; x<pairs1.length; x++){
            for(let y=0; y<pairs2.length; y++){
                if(pairs1[x]==pairs2[y]) hits++;
            }
        }
        if(hits>0) {
            return ((2 * hits) / total_length);    // multiply by 2 to ensure score is between 0 and 1 
        }
    }
    return 0.0
}

(()=>{
    let string = 'abcdefgeh';
    console.log(get_bigrams(string));
    console.log(string_similarity("abcd",'abcd'))
    console.log(string_similarity("epigamia greek yogurt", "Epigamia Vanilla Bean Greek Yogurt, 90g"))
    console.log(string_similarity("epigamia greek yogurt", "Epigamia Greek Yogurt, Strawberry, 90g"))
})()


async function scrapeAmazonPrices(searchString,count,scraperType='household_items'){
    let url = 'https://www.amazon.in';
    let product_name_xpath_template = '//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[##]/div/span/div/div/div[2]/h2/a/span';
    let product_price_xpath_template = '//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[##]/div/span/div/div/div[4]/div/div/div/a/span[1]/span[2]/span[2]';
    let product_image_xpath_template = '//*[@id="search"]/div[1]/div[2]/div/span[3]/div[2]/div[##]/div/span/div/div/span/a/div/img';
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
        
        console.log(`${products.length} products found`);
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

