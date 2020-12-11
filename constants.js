
const scraper_categories = {
    ELECTRONICS:'electronics',
    GENERAL:'general',
    HOUSEHOLD_ITEMS:'household_items'
};

module.exports = {
    DATA_FETCH_CONFIG: {
        time_interval_ms: 1000 * 60 * 30,
        scraper_config:{
            queries: ['snacks','chocolates','drinks','healthy snacks'],
            max_products: 200,
            scraper_category: scraper_categories.HOUSEHOLD_ITEMS
        },
    }
} 

