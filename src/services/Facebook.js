
const axios = require('axios');
const SendbirdDesk = require('./SendbirdDesk');
class Facebook {
    constructor() {
    }
    processWebhook(payload, res) {
        try {
            console.log('FACEBOOK PAYLOAD:-', payload);
            // Checks this is an event from a page subscription
            if (payload.object === 'page') {
                // Iterates over each entry - there may be multiple if batched
                payload.entry.forEach(function (entry) {
                    // Gets the message. entry.messaging is an array, but 
                    // will only ever contain one message, so we get index 0
                    let webhook_event = entry.messaging[0];
                    console.log('FACEBOOK MESSAGE:-', webhook_event);
                    const sender_id = webhook_event.sender.id;
                    const sendbird_id = `facebook_${sender_id}`;
                    const message = webhook_event.message.text;
                    const nickname = `facebook_${sender_id}`;
                    return SendbirdDesk.processMessage(sendbird_id, message, nickname, { "facebook": sender_id }).then(result => res.status(200).send(result))
                });
            } else {
                console.log('FACEBOOK FAILURE:-', webhook_event);
                // Returns a '404 Not Found' if event is not from a page subscription
                res.sendStatus(404);
            }
        }
        catch (err) {
            console.log('FACEBOOK FAILURE:-', err);
            res.sendStatus(404);
        }
        // SendbirdDesk.processMessage();
    }
    sendMessage(sender, message) {
        console.log("FACEBOOK sendMessage", { sender, message });
        var authOptions = {
            method: 'POST',
            url: `https://graph.facebook.com/v12.0/me/messages?access_token=${process.env.FACEBOOK_ACCESS_TOKEN}`,
            data: {
                "messaging_type": "RESPONSE",
                "recipient": {
                    "id": sender
                },
                "message": {
                    "text": message
                }
            },
            json: true
        };
        return axios(authOptions).then(res => {
            console.log("FACEBOOK MESSAGE SENT!");
            return "FACEBOOK MESSAGE SENT! ";
        }).catch(error => {
            console.log("FACEBOOK MESSAGE ERROR", error);
            return false
        })
    }

    verification(req, res) {
        try {

            // Your verify token. Should be a random string.
            let VERIFY_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN

            // Parse the query params
            let mode = req.query['hub.mode'];
            let token = req.query['hub.verify_token'];
            let challenge = req.query['hub.challenge'];

            // Checks if a token and mode is in the query string of the request
            if (mode && token) {

                // Checks the mode and token sent is correct
                if (mode === 'subscribe' && token === VERIFY_TOKEN) {

                    // Responds with the challenge token from the request
                    console.log(' FACEBOOK_WEBHOOK_VERIFIED');
                    res.status(200).send(challenge);

                } else {
                    console.log('FACEBOOK_WEBHOOK_VERIFICATION_FAIL');
                    // Responds with '403 Forbidden' if verify tokens do not match
                    res.sendStatus(403);
                }
            }
        }
        catch (err) {
            console.log('FACEBOOK_WEBHOOK_VERIFICATION_FAIL');
            res.sendStatus(403);
        }
    }
}
var facebook = new Facebook();
module.exports = facebook
