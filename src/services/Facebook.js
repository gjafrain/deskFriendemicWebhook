
const axios = require('axios');
// const SendbirdDesk = require('./SendbirdDesk');

class Facebook {
    constructor() {
    }

    fetchPagesAccessTokens(res) {

        console.log('Facebook.fetchPagesAccessTokens'); //,{globalTokens:global.facebookTokens}
        if (global.facebookTokens) {
            return new Promise(function (resolve, reject) {
                resolve(global.facebookTokens);
            });
        }
        var authOptions = {
            method: 'GET',
            url: `https://graph.facebook.com/v12.0/${process.env.FACEBOOK_USER_ID}/accounts?fields=access_token&access_token=bearer ${process.env.FACEBOOK_USER_ACCESS_TOKEN}`,
            json: true
        };
        return axios(authOptions).then(response => {
            console.log("FACEBOOK TOKEN FETCH SUCCESS :- "); //, response.data
            global.facebookTokens = response.data.data;
            return response.data.data;
        }).catch(error => {
            console.log("FACEBOOK TOKEN FETCH ERROR :- ", error.response.data);
            return null;
        })
    }
    processWebhook(payload, res, SendbirdDesk) {
        try {
            console.log('FACEBOOK PAYLOAD:-', { payload });
            // Checks this is an event from a page subscription
            if (payload.object === 'page') {
                // Iterates over each entry - there may be multiple if batched
                console.log('FACEBOOK MESSAGE LENGTH:-', payload.entry.length);
                payload.entry.forEach(function (entry) {
                    // console.log('FACEBOOK ENTRY:-', { entry });
                    // Gets the message. entry.messaging is an array, but 
                    // will only ever contain one message, so we get index 0
                    let webhook_event = entry.messaging[0];
                    // console.log('FACEBOOK MESSAGE:-', { webhook_event });
                    const page_id = entry.id;
                    const sender_id = webhook_event.sender.id;
                    const sendbird_id = `facebook_${page_id}_${sender_id}`;
                    const message = webhook_event.message.text;
                    const nickname = `[Facebook] ${sender_id}`;
                    res.status(200).send("FACEBOOK MESSAGE SENT :-")
                    return SendbirdDesk.processMessage(sendbird_id, message, nickname, { "facebook": page_id, "sender_id": sender_id })
                    // .then(result => {res.status(200).send(result)})
                });
            } else {
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
    sendMessage(page_id, message, sender_id) {
        console.log("Facebook.sendMessage", { page_id, message, sender_id });
        return this.fetchPagesAccessTokens().then(tokens => {
            console.log("Facebook.PageTokens"); //, { tokens }
            let access_token = null
            if (tokens) {
                let page = tokens.find(x => x.id == page_id);
                if (page) access_token = page.access_token
            }
            if (!access_token) {
                console.log("Facebook.sendMessage Failed to Find Matching Page Token")
                return null;
            }
            console.log("Facebook.FoundToken", { page_id, access_token });
            var authOptions = {
                method: 'POST',
                url: `https://graph.facebook.com/v12.0/me/messages?access_token=${access_token}`,
                data: {
                    "messaging_type": "RESPONSE",
                    "recipient": {
                        "id": sender_id
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
                let errormsg = error.response.data
                console.log("FACEBOOK MESSAGE ERROR", { page_id, access_token, errormsg });
                return false
            })
        });
    }

    verification(req, res) {
        try {

            this.fetchPagesAccessTokens().then(tokens => {

                // Your verify token. Should be a random string.
                let VERIFY_TOKEN = tokens.shift();

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
            });
        }
        catch (err) {
            console.log('FACEBOOK_WEBHOOK_VERIFICATION_FAIL');
            res.sendStatus(403);
        }
    }
}
var facebook = new Facebook();
module.exports = facebook
