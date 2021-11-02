const router = require('express').Router();
// IMPORT ROUTES
require('dotenv').config()
const SendbirdDesk = require('./services/SendbirdDesk');
const SendbirdChat = require('./services/SendbirdChat');
const Bandwidth = require('./services/Bandwidth');
const Telegram = require('./services/Telegram');
const Twilio = require('./services/Twilio');
const GoogleMyBusiness = require('./services/GoogleMyBusiness');
const Facebook = require('./services/Facebook');
// Webhook Endpoints
router.post('/desk',        (req, res) => SendbirdDesk.processWebhook(req.body, res));
router.post('/chat',        (req, res) => SendbirdChat.processWebhook(req.body, res));
router.post('/telegram',    (req, res) => Telegram.processWebhook(req.body, res, SendbirdDesk));
router.post('/twilio',      (req, res) => Twilio.processWebhook(req.body, res, SendbirdDesk));
router.post('/bandwidth',   (req, res) => Bandwidth.processWebhook(req.body, res, SendbirdDesk));
router.post('/gmb',         (req, res) => GoogleMyBusiness.processWebhook(req.body, res, SendbirdDesk));
router.post('/facebook',         (req, res) => Facebook.processWebhook(req.body, res));
router.get('/facebook',         (req, res) => Facebook.verification(req, res));
// Special Routes
router.get('/desk/closeOpenTickets', (req, res) => SendbirdDesk.closeOpenTickets(res));
router.get('/desk/closeTicket/:ticketId', (req, res) => SendbirdDesk.closeTicket(req.params.ticketId, res));
module.exports = router;