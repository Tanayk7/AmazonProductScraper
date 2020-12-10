const express = require('express');
const path = require('express');
const cors = require('cors');
const router = require('./router');

const PORT = 5000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));
app.use('/',router);

app.listen(PORT,() => {
    console.log(`Server listening on port ${PORT}`);
})
