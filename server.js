'use strict';
const Sendbird = require("./sendbird.js");
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');

app.disable('x-powered-by')

const router = express.Router();
router.get('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<h1>Hello from Express.js!</h1>');
  res.end();
});

router.post('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<h1>Webhook Response</h1>');
  
  res.write('<pre>'+Sendbird.processWebhook(req.body)+'</pre>');
  res.end();
});


app.use(bodyParser.json());
app.use('/', router);  // path must route to lambda
// app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

app.listen(3000, () => console.log('Local app listening on port 3000!'));
