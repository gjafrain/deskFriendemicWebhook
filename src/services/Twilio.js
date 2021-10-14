
const axios = require('axios');
const SendbirdDesk = require('./SendbirdDesk');
const accountSid = "AC34a94e0a8b7c7aa1de244a5711718543"; //process.env.TWILIO_ACCOUNT_SID;
const authToken = '5972495' + "b46c7534" + "2ca9a83096"+ 'acac001';
const twilioClient = require('twilio')(accountSid, authToken);
class Twilio {
    constructor() {
    }
    processWebhook(payload, res, SendbirdDesk) { //CUSTOMER TO CLIENT
        console.log("Twilio Payload",{payload});
        if(!payload) return res.send("No Payload");
        if(!payload.From) return res.send("No Sender");
        // SEE https://www.twilio.com/docs/usage/webhooks/sms-webhooks
        const message = payload.Body;
        const from_phone_num = payload.From.replace(/\D+/g,'');
        const to_phone_num = payload.To.replace(/\D+/g,'');
        const sendbird_id = `twilio_${to_phone_num}_${from_phone_num}`;
        const nickname = "SMS " + from_phone_num;
        return SendbirdDesk.processMessage(sendbird_id, message, nickname, { "twilio": to_phone_num.toString(), "customer_phone_num": from_phone_num.toString() }).then(result => res.send(result))
    }
    sendMessage(from_phone_num, message, to_phone_num) { //CLIENT TO CUSTOMER
        twilioClient.messages
            .create({
                body: message,
                from: from_phone_num,
                to: to_phone_num
            })
            .then(message => "SMS Message SENT. " + message)
            .catch(e=>console.log("SMS FAILED ",e));
        return null
    }
}
var twilio = new Twilio();
module.exports = twilio
