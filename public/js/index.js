let search_form = document.getElementById("search-form");
let products_container = document.querySelector('.products');
let best_match_container = document.querySelector(".best-match");
let results_container = document.querySelector('.results');
let loader_container = document.querySelector('.loader-container');
let total_results = document.querySelector('.total-results');

function showLoader(){
    loader_container.style.display = "flex";
}
function hideLoader(){
    loader_container.style.display = "none";
}

search_form.addEventListener("submit",async (e) => {
    e.preventDefault();
    let query = search_form.elements['search-query'].value;
    let data = {
        query: query,
        max_products: 200
    }
    let endpoint = 'http://localhost:5000/products';
    try{
        showLoader();
        let response = await fetch(endpoint,{
            method:"post",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(data)
        });
        let json = await response.json();
        let products = json.products;
        let best_match = json.bestMatch;
        if(products.length === 0){
            best_match_container.innerHTML = "No results found";
            products_container.innerHTML = "No results found";
            total_results.innerHTML = "Total results: 0"
        }
        else{
            renderResults(products,best_match);
        }
        hideLoader();
    }
    catch(error){
        console.log(error)
    }
})

function renderResults(products,best_match){
    let bestMatchProduct = `
        <div class="product">
            <div class='product-image-container'> 
                <img src='${best_match.product_image}' class='product-image'>
            </div>
            <div class='product-text'>
                <div class="product-name">
                ${best_match.product_name}
                </div>
                <div class="product-price">
                    ₹${best_match.product_price}
                </div>
            </div>
        </div>
    `;
    best_match_container.innerHTML = bestMatchProduct;
    
    total_results.innerHTML = "Total results: " + products.length;
    let all_results = "";
    for(let product of products){
        let product_html = `
            <div class="product">
                <div class='product-image-container'>
                    <img src='${product.product_image}' class='product-image'>
                </div>
                <div class='product-text'>
                    <div class="product-name">
                        ${product.product_name}
                    </div>
                    <div class="product-price">
                        ₹${product.product_price}
                    </div>
                </div>
            </div>
        `;
        all_results += product_html;
    }
    products_container.innerHTML = all_results;
}