
const axios = require('axios');
const { AppID, SendbirdChatToken } = require('../utils/sendBirdConfig');
const Telegram = require('./Telegram');
const GoogleMyBusiness = require('./GoogleMyBusiness');
const Twilio = require('./Twilio');
const Bandwidth = require('./Bandwidth');
class SendbirdChat {
    constructor(app_id, token) {
        this.app_id = app_id;
        this.token = token;
        this.ChatHeaders = {
            "Api-Token": this.token,
            "Content-Type": "application/json"
        };
    }
    processWebhook(payload, res) {
        const appId = payload.app_id;
        const sender = payload.sender;
        const channel = payload.channel;
        const message = payload.payload;
        if (appId !== AppID) return res.send("Wrong App"); //Must be Friendemic's App
        if (!sender) return res.send("No Sender");; //Must have Sender
        if (!/^sendbird_desk_agent_id/.test(sender.user_id)) return res.send("Not Agent"); //Must be sent by Desk Agent 
        //TODO only process agent messages
        return this.findService(channel).then(metadata => {
            console.log({ metadata, message });
            if (metadata.telegram) return res.send(this.sendToTelegram(sender, message, metadata.telegram));
            if (metadata.twilio) return res.send(this.sendToTwilio(metadata.twilio, message, metadata.customer_phone_num));
            if (metadata.bandwidth) return res.send(this.sendToBandwidth(metadata.bandwidth, message, metadata.customer_phone_num));
            if (metadata.facebook) return res.send(this.sendToFacebook(metadata.facebook, message));
            if (metadata.gmb_agent) return res.send(this.sendToGoogle(metadata.gmb_agent, metadata.conversationId, message));

            return res.send("Could not process requrest.");
        });
    }
    findService(channel) {
        console.log("SendbirdChat.findService", channel.channel_url)
        var authOptions = {
            method: 'GET',
            url: `https://api-${this.app_id}.sendbird.com/v3/group_channels/${channel.channel_url}/metadata`,
            headers: this.ChatHeaders,
        };
        return axios(authOptions).then(res => {
            return res.data
        }).catch(e => false);
    }
    sendMessage(channel, sendbird_id, message) {
        console.log("SendbirdChat.sendMessage", { channel, sendbird_id, message })
        var authOptions = {
            method: 'POST',
            url: `https://api-${this.app_id}.sendbird.com/v3/group_channels/${channel}/messages`, data: {
                "message_type": "MESG",
                "user_id": sendbird_id,
                "message": message
            },
            json: true,
            headers: this.ChatHeaders,
        };
        return axios(authOptions).then(res => {
            if (!res.data || !res.data.message_id) return "Message Failed to Send.";
            return `Message ${res.data.message_id} Sent.`;
        }).catch(e => console.log("sendMessage FAILURE", e.response.data));;
    }
    getUser(sendbird_id, nickname) {
        console.log("SendbirdChat.getUser", { sendbird_id })
        var authOptions = {
            method: 'GET',
            url: `https://api-${this.app_id}.sendbird.com/v3/users/${sendbird_id}`,
            headers: this.ChatHeaders,
        };
        return axios(authOptions).then(res => {
            if (res.data.user_id) return res.data.user_id;
        }).catch(e => { if (e.response.data.code === 400201) return this.createUser(sendbird_id, nickname) });
    }
    createUser(sendbird_id, nickname) {
        console.log("SendbirdChat.createUser", { sendbird_id })
        var authOptions = {
            method: 'POST',
            url: `https://api-${this.app_id}.sendbird.com/v3/users`, data: {
                "user_id": sendbird_id,
                "nickname": nickname,
                "profile_url": ""
            },
            json: true,
            headers: this.ChatHeaders,
        };
        return axios(authOptions).then(res => {
            if (!res.data || !res.data.user_id) return false;
            return res.data.user_id;
        }).catch(e => console.log("createUser FAILURE", e.response));
    }
    setChannelMetadata(channel, metadata) {
        console.log("SendbirdChat.setChannelMetadata", { channel, metadata });
        var authOptions = {
            method: 'POST',
            url: `https://api-${this.app_id}.sendbird.com/v3/group_channels/${channel}/metadata`, data: {
                "metadata": metadata
            },
            json: true,
            headers: this.ChatHeaders,
        };
        return axios(authOptions).then(res => { console.log(res.data) }).catch(e => { console.log(e.response.data) });
    }
    sendToTelegram(sender, message, chat_id) {
        console.log("SendbirdChat.sendToTelegram", message.message)
        let messageText = `${message.message} —${sender.nickname}`;
        return Telegram.sendMessage(chat_id, messageText);
    }
    sendToGoogle(agent, conversationId, message) {
        console.log("SendbirdChat.sendToGoogle", { agent, conversationId }, message.message)
        return GoogleMyBusiness.sendMessage(conversationId, message);
    }
    sendToTwilio(clientPhoneNumber, message, customerPhoneNumber) {
        console.log("SendbirdChat.sendToTwilio", { clientPhoneNumber, customerPhoneNumber }, message.message)
        return Twilio.sendMessage(clientPhoneNumber, message.message, customerPhoneNumber);
    }
    sendToBandwidth(clientPhoneNumber, message, customerPhoneNumber) {
        console.log("SendbirdChat.sendToBandwidth", { clientPhoneNumber, customerPhoneNumber }, message.message)
        return Bandwidth.sendMessage(clientPhoneNumber, message.message, customerPhoneNumber);
    }
    sendToFacebook(id, message) {
        console.log("SendbirdChat.sendToFacebook", { id, message })
        return Bandwidth.sendMessage(id, message);
    }
}
var chat = new SendbirdChat(process.env.SENDBIRD_APPLICATION_ID, process.env.SENDBIRD_CHAT_API_TOKEN);
module.exports = chat
