
const axios = require('axios');
const SendbirdDesk = require('./SendbirdDesk');
class Bandwidth {
    constructor() {
    }
    processWebhook(payload, res, SendbirdDesk) { //CUSTOMER TO CLIENT
        // SEE https://dev.bandwidth.com/messaging/callbacks/messageEvents.html
        console.log("Bandwidth.processWebhook", payload[0]);
        if (!payload) return res.send("No Payload");
        let messageData = payload?.shift()?.message;
        if (!messageData) return res.send("No Message");
        let from = messageData?.from;
        let to = messageData?.to.shift();
        //return res.send("<pre>"+JSON.stringify(messageData,null,2)+"</pre>");
        if (!from) return res.send("No Sender");
        const message = messageData?.text;
        const from_phone_num = from.replace(/\D+/g, '');
        const to_phone_num = to.replace(/\D+/g, '');
        const sendbird_id = `bandwidth_${to_phone_num}_${from_phone_num}`;
        const nickname = "SMS " + from_phone_num;
        return SendbirdDesk.processMessage(sendbird_id, message, nickname, { "bandwidth": to_phone_num.toString(), "customer_phone_num": from_phone_num.toString() }).then(result => res.send(result))
    }
    sendMessage(from_phone_num, message, to_phone_num) { //CLIENT TO CUSTOMER
        var axios = require('axios');
        var data = JSON.stringify({
            "to": [
                "+"+to_phone_num
            ],
            "from": "+"+from_phone_num,
            "text": message,
            "applicationId": process.env.BANDWIDTH_APP_ID
        });

        var config = {
            method: 'post',
            url: `https://messaging.bandwidth.com/api/v2/users/${process.env.BANDWIDTH_ACCOUNT}/messages`,
            headers: {
                'Content-type': 'application/json',
                'Authorization': 'Basic '+Buffer.from(`${process.env.BANDWIDTH_USER}:${process.env.BANDWIDTH_PASSWORD}`).toString('base64')
            },
            data: data
        };

        axios(config)
        .then(message => "SMS Message SENT. " + message)
        .catch(e => console.log("SMS FAILED ", e));

    }
}
var bw = new Bandwidth();
module.exports = bw
