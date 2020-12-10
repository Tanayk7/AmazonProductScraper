const express = require("express");
const router = express.Router();
const scrapePrices = require('scraper.js');

router.post('/products',async (req,res)=>{
    let query = req.body.query;
    let max_products = req.body.max_products;
    let output = await scrapePrices(query,max_products);
    return output;
});
