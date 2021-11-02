
const axios = require('axios');
const businessmessages = require('businessmessages');
const { v4: uuidv4 } = require('uuid'); 
const { google } = require('googleapis');
// Initialize the Business Messages API
let bmApi = new businessmessages.businessmessages_v1.Businessmessages({});

// Set the scope that we need for the Business Messages API
const scopes = [
    'https://www.googleapis.com/auth/businessmessages',
];

class GoogleMyBusiness {
    constructor() {
    }
    processWebhook(payload, res, SendbirdDesk) {
        console.log("GoogleMyBusiness.processWebhook", payload);
        if (!payload) return res.send("No Payload");
        let messageData = payload?.message;
        if (!messageData) return res.send("No Message");
        const conversationId = payload.conversationId;
        const agent = payload.agent;
        if (!payload?.context?.userInfo?.displayName) return res.send("No Sender");
        const message = messageData.text;
        const from_name = payload.context.userInfo.displayName.toLowerCase().replace(/[^a-z0-9]/, "-");
        const sendbird_id = `google_${agent.split("/")[1]}_${from_name}`;
        const nickname = "[Google] "+payload.context.userInfo.displayName;
        return SendbirdDesk.processMessage(sendbird_id, message, nickname, { "gmb_agent": agent, "conversationId": conversationId }).then(result => res.send(result))

    }


    sendMessage(conversationId,message) {
        this.sendGoogleMessage(conversationId, message);
    }



    sendGoogleMessage = async (conversationId, message) => {
        let authClient = await this.initCredentials();

        // Create the payload for sending a message
        let apiParams = {
            auth: authClient,
            parent: 'conversations/' + conversationId,
            forceFallback: true, // Force usage of the fallback text
            resource: {
                messageId: uuidv4(),
                representative: {
                    representativeType: 'HUMAN',
                },
                text: message,
                fallback: 'This is the fallback text'
            },
        };

        // Call the message create function using the
        // Business Messages client library
        bmApi.conversations.messages.create(apiParams,
            { auth: authClient }, (err, response) => {
                console.log(err);
                console.log(response);
            });
    }


    initCredentials = async () => {
        // configure a JWT auth client
        let authClient = new google.auth.JWT(
            process.env.GOOGLE_CLIENT_EMAIL,
            null,
            process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g,"\n"),
            scopes,
        );

        return new Promise(function (resolve, reject) {
            // authenticate request
            authClient.authorize(function (err, tokens) {
                if (err) {
                    reject(false);
                } else {
                    resolve(authClient);
                }
            });
        });
    }




}
var gmb = new GoogleMyBusiness();
module.exports = gmb

