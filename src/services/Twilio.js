
const axios = require('axios');
const SendbirdDesk = require('./SendbirdDesk');
class Twilio {
    constructor() {
    }
    processWebhook(payload, res) {
        return null
        // SendbirdDesk.processMessage();
    }
    sendMessage(sender, message, channel) {
        return null
    }
}
var twilio = new Twilio();
module.exports = twilio
