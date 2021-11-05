'use strict';
const express = require('express');
const path = require('path');
const app = express();
const { urlencoded, json } = require('body-parser');
// 
const router = require("./src/routes.js");
const facebook = require('./src/services/Facebook.js');
app.disable('x-powered-by')
app.use(urlencoded({ extended: false }));
app.use(json());
// DEFAULT ROUTE
app.get('/', (req, res) => { facebook.fetchPagesAccessTokens(res) })
//
app.use('/', router);
const port = process.env.PORT || 3000
app.listen(port, () => console.log('Local app listening on port' + port + '!'));
