if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const user = require("./routes/user");
const login = require("./routes/login");
const event = require("./routes/event");
const ticket = require("./routes/ticket");
const company = require("./routes/company");
const gerencianet = require("./routes/gerencianet");
const Joi = require('joi');


require("./queue/queue");
require('express-async-errors');

// Enable CORS for all routes
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,locale');
    next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Rota para renderizar a view
app.get('/', (req, res) => {
    res.render('index');
});


app.use(express.json());
app.use("/users", user);
app.use("/login", login);
app.use("/company", company);
app.use("/ticket", ticket);
app.use("/event", event);
app.use("/gerencianet", gerencianet);

app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`)
});