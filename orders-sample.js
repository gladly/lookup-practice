//Requires local environment variables via a .env file
require('dotenv').config();

//Requird libraries for a node.js application using the express framework
const express = require('express');
const basicAuth = require('express-basic-auth');
const bodyParser = require('body-parser');
const request = require('request');
let app = express();

//Setup Basic authentication
let basicAuthObj = {
  users: {}
};
const USERNAME = process.env.USERNAME;
basicAuthObj.users[USERNAME] = process.env.PASSWORD;

//app.use(basicAuth(basicAuthObj));
app.use(bodyParser.json());
app.use(bodyParser.raw({ type: () => true }));

const lookupRoutes = require('./controllers/orders');
app.use('/', lookupRoutes());

//Start app and make it available on localhost:6000
const port = process.env.PORT || 7000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
