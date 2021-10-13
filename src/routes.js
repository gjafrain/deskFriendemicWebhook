const router = require('express').Router();

// IMPORT ROUTES
const SendbirdDesk = require('./services/SendbirdDesk');
const SendbirdChat = require('./services/SendbirdChat');
const Telegram = require('./services/Telegram');
const Twilio = require('./services/Twilio');
const GoogleMyBusiness = require('./services/GoogleMyBusiness');


// Webhook Endpoints
router.post('/desk',        (req, res) => SendbirdDesk.processWebhook(req.body, res));
router.post('/chat',        (req, res) => SendbirdChat.processWebhook(req.body, res));
router.post('/telegram',    (req, res) => Telegram.processWebhook(req.body, res, SendbirdDesk));
router.post('/twilio',      (req, res) => Twilio.processWebhook(req.body, res));
router.post('/gmb',         (req, res) => GoogleMyBusiness.processWebhook(req.body, res));

// Special Routes
router.get('/desk/closeOpenTickets', (req, res) => SendbirdDesk.closeOpenTickets(res));
router.get('/desk/closeTicket/:ticketId', (req, res) => SendbirdDesk.closeTicket(req.params.ticketId, res));

module.exports = router;