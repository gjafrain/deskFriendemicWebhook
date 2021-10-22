
const axios = require('axios');
const SendbirdDesk = require('./SendbirdDesk');
class GoogleMyBusiness {
    constructor() {
    }
    processWebhook(payload, res) {
        console.log(payload);
        console.log(JSON.stringify(payload));
        return null
        // SendbirdDesk.processMessage();
    }
    sendMessage(sender, message, channel) {
        return null
    }
}
var gmb = new GoogleMyBusiness();
module.exports = gmb
