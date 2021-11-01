
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
                });

                // Returns a '200 OK' response to all requests
                res.status(200).send('EVENT_RECEIVED');
                const user_id = payload.message.from.id;
                const chat_id = payload.message.chat.id;
                const sendbird_id = `telegram_${chat_id}_${user_id}`;
                const message = payload.message.text;
                const nickname = payload.message.from.first_name + " " + payload.message.from.last_name;
                return SendbirdDesk.processMessage(sendbird_id, message, nickname, { "telegram": chat_id.toString() }).then(result => res.status(200).send(result))
            } else {
                console.log('FACEBOOK FAILURE:-', webhook_event);
                // Returns a '404 Not Found' if event is not from a page subscription
                res.sendStatus(404);
            }
        }
        catch (err) {
            console.log('FACEBOOK FAILURE:-', err);
        }
        // SendbirdDesk.processMessage();
    }
    sendMessage(sender, message, channel) {
        return null
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
