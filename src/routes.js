const router = require('express').Router();
const { closeTicket } = require('./api/closeTicket');
// IMPORT ROUTES
const ticketRouting = require('./api/ticketRouting');
// Define routes
router.post('/ticketRouting', (req, res) => ticketRouting.processWebhook(req.body, res));
router.post('/closeTicket/:ticketId', (req, res) => closeTicket(req.params, res));

module.exports = router;