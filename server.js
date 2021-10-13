'use strict';
const express = require('express');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
// 
const router = require("./src/routes.js");
app.disable('x-powered-by')
app.use(bodyParser.json());
// DEFAULT ROUTE
app.get('/', (req, res) => { res.send('Webhook Server') })
//
app.use('/',  router);
const port = process.env.PORT || 3000
app.listen(port, () => console.log('Local app listening on port' + port + '!'));
