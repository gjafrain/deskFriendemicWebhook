
const axios = require('axios');
const SendbirdDesk = require('./SendbirdDesk');
const accountSid = "AC5c111a6a9cbaa3cf05e271320a2310f9"; //process.env.TWILIO_ACCOUNT_SID;
const authToken = "2bedb8fd7" + "cde8fb9" + "102380c" + "79749b9a9" //'5972495' + "b46c7534" + "2ca9a83096"+ 'acac001';
const twilioClient = require('twilio')(accountSid, authToken);
class Twilio {
    constructor() {
    }
    processWebhook(payload, res, SendbirdDesk) { //CUSTOMER TO CLIENT
        console.log("Twilio.processWebhook");
        if (!payload) return res.send("No Payload");
        if (!payload.From) return res.send("No Sender");
        // SEE https://www.twilio.com/docs/usage/webhooks/sms-webhooks
        const message = payload.Body;
        const from_phone_num = payload.From.replace(/\D+/g, '');
        const to_phone_num = payload.To.replace(/\D+/g, '');
        const sendbird_id = `twilio_${to_phone_num}_${from_phone_num}`;
        const nickname = "SMS " + from_phone_num;
        return SendbirdDesk.processMessage(sendbird_id, message, nickname, { "twilio": to_phone_num.toString(), "customer_phone_num": from_phone_num.toString() }).then(result => res.send(result))
    }
    sendMessage(from_phone_num, message, to_phone_num) { //CLIENT TO CUSTOMER
        twilioClient.messages
            .create({
                body: message,
                from: "+" + from_phone_num,
                to: "+" + to_phone_num
            })
            .then(message => "SMS Message SENT. " + message)
            .catch(e => console.log("SMS FAILED ", e));
        return null
    }
}
var twilio = new Twilio();
module.exports = twilio
