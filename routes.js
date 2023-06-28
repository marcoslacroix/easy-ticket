require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const order = require("./routes/order");
const user = require("./routes/user");
const login = require("./routes/login");

// Enable CORS for all routes
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(bodyParser.json());
app.use(express.json());
app.use("/order", order);
app.use("/users", user);
app.use("/login", login);
  
app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`)
});