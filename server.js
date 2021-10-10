'use strict';
const Sendbird = require("./sendbird.js");
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');

app.disable('x-powered-by')

const router = express.Router();

router.post('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<h1>Webhook Response</h1>');

  res.write('<pre>' + Sendbird.processWebhook(req.body) + '</pre>');
  res.end();
});

app.use(bodyParser.json());

// DEFAULT ROUTE
app.get('/', (req, res) => { res.send('Welcome To Desk Friendemic Webhook :)') })
//
app.post('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<h1>Webhook Response</h1>');
  res.write('<pre>' + Sendbird.processWebhook(req.body) + '</pre>');
  res.end();
});

const port = process.env.PORT || 3000
app.listen(port, () => console.log('Local app listening on port' + port + '!'));
