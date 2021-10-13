const router = require('express').Router();

// IMPORT ROUTES
const SendbirdDesk = require('./api/SendbirdDesk');
const SendbirdChat = require('./api/SendbirdChat');
const Telegram = require('./api/Telegram');
const Twilio = require('./api/Twilio');
const GoogleMyBusiness = require('./api/GoogleMyBusiness');


const ticketRouting = require('./api/ticketRouting');
const { closeTicket } = require('./api/closeTicket');

// Webhook Endpoints
router.post('/desk',        (req, res) => SendbirdDesk.processWebhook(req.body, res));
router.post('/chat',        (req, res) => SendbirdChat.processWebhook(req.body, res));
router.post('/telegram',    (req, res) => Telegram.processWebhook(req.body, res, SendbirdDesk));
router.post('/twilio',      (req, res) => Twilio.processWebhook(req.body, res));
router.post('/gmb',         (req, res) => GoogleMyBusiness.processWebhook(req.body, res));

// Special Routes
router.post('/ticketRouting', (req, res) => ticketRouting.processWebhook(req.body, res));
router.post('/closeTicket/:ticketId', (req, res) => closeTicket(req.params, res));

module.exports = router;