//Requires local environment variables via a .env file
require('dotenv').config();

//Requird libraries for a node.js application using the express framework
const express = require('express');
const basicAuth = require('express-basic-auth');
const bodyParser = require('body-parser');
const request = require('request');
const { logger, validateGladlySignature } = require('./helpers/index');

let app = express();

app.use(bodyParser.json());
app.use(bodyParser.raw({ type: () => true }));

app.use(logger);
app.use(validateGladlySignature);

const lookupRoutes = require('./controllers/orders');
app.use('/', lookupRoutes());

//Start app and make it available on localhost:6000
const port = process.env.PORT || 7000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
