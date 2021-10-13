
const axios = require('axios');
const { AppID, SendbirdChatToken } = require('../utils/sendBirdConfig');
const Telegram = require('./Telegram');
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
        if (appId !== AppID) return false; //Must be Friendemic's App

       return this.findService(channel).then(metadata=>{
            console.log(metadata);
            if(metadata.telegram) return res.send(this.sendToTelegram(sender, message, metadata.telegram));

            return res.send("Could not process requrest.");
        });

    }

    findService(channel)
    {
        console.log("SendbirdChat.findService",channel.channel_url)
        var authOptions = {
            method: 'GET',
            url: `https://api-${this.app_id}.sendbird.com/v3/group_channels/${channel.channel_url}/metadata`,
            headers: this.ChatHeaders,
        };
        return axios(authOptions).then(res => {
            return res.data

        }).catch(e=>false);
    }

    sendMessage(channel, sendbird_id, message) {
        console.log("SendbirdChat.sendMessage",{channel, sendbird_id, message})
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
            if(!res.data || !res.data.message_id) return "Message Failed to Send.";
            return `Message ${res.data.message_id} Sent.`;
        }).catch(e=>console.log("sendMessage FAILURE",e.response.data));;
    }


    getUser(sendbird_id, nickname)
    {
        
        console.log("SendbirdChat.getUser",{sendbird_id})
        var authOptions = {
            method: 'GET',
            url: `https://api-${this.app_id}.sendbird.com/v3/users/${sendbird_id}`, 
            headers: this.ChatHeaders,
        };
        return axios(authOptions).then(res => {
            if(res.data.user_id) return res.data.user_id;
        }).catch(e=>{if(e.response.data.code===400201) return this.createUser(sendbird_id, nickname)});
    }


    createUser(sendbird_id, nickname) {
        console.log("SendbirdChat.createUser",{sendbird_id})
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
            if(!res.data || !res.data.user_id) return false;
            return res.data.user_id;
        }).catch(e=>console.log("createUser FAILURE",e.response));
    }


    setChannelMetadata(channel, metadata) {
        
        console.log("SendbirdChat.setChannelMetadata",{channel,metadata});

        var authOptions = {
            method: 'POST',
            url: `https://api-${this.app_id}.sendbird.com/v3/group_channels/${channel}/metadata`, data: {
                "metadata": metadata
            },
            json: true,
            headers: this.ChatHeaders,
        };
        return axios(authOptions).then(res => {console.log(res.data)}).catch(e=>{console.log(e.response.data)});
    }

    sendToTelegram(sender, message, chat_id) {
        console.log("SendbirdChat.sendToTelegram",message.message)
        let messageText = `From: ${sender.nickname} | Message: ${message.message} | Chat Id: ${chat_id}`;
        return Telegram.sendMessage(chat_id, messageText);
    }


    sendToGMB(sender, message, channel) {
        return null
    }


    sendToTwilio(sender, message, channel) {
        return null
    }
}
var chat = new SendbirdChat(AppID, SendbirdChatToken);
module.exports = chat
