require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const mongoose = require("mongoose");
const socketio = require('socket.io');
const router = require('./Router/router');
const scrapeData = require('./scraper');
const constants = require('./constants');

const PORT = 5000;
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const database_uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@mern-app.o5cvu.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

let auto_scrape_data = false;
let products = {};
let queries = constants.DATA_FETCH_CONFIG.scraper_config.queries;
let max_products = constants.DATA_FETCH_CONFIG.scraper_config.max_products;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));
app.use('/',router);

mongoose.connect(
    database_uri,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
    (err) => {
        if(err){
            console.log("Error connecting to database");
            return err;
        }
        console.log("Connected to database successfully");
    }
);

io.on("connection",(socket) => {
    console.log("Client connected");
    socket.on("disconnect",()=>{
        console.log("Client disconnected");
    })
});

server.listen(PORT,async () => {
    console.log(`Server listening on port ${PORT}`);
    if(auto_scrape_data){
        initializeProducts();
        console.log("All products: ",products);
    
        await fetchData(queries);
        console.log("Fetching first time data...");
    
        io.emit('data-change',products);
        console.log("Data sent to client");
    
        setInterval(async () =>{
            console.log("Time to re-fetch the data...");  
    
            await fetchData(queries); 
            console.log("Fetching data...");
            
            io.emit('data-change',products);
            console.log("Data sent to client");
        },constants.DATA_FETCH_CONFIG.time_interval_ms)
    }
});

function initializeProducts(){
    for(let key of constants.DATA_FETCH_CONFIG.scraper_config.queries){
        console.log(key);
        products[key] = {};
    }
}

async function fetchData(queries){
    for(let query of queries){
        products[query] = await scrapeData(query,max_products);
        console.log(products);
    }
}