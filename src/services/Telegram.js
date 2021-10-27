
const axios = require('axios');
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
const SendbirdDesk = require('./SendbirdDesk');
class Telegram {
    constructor(app_id, token) {
        this.app_id = app_id;
        this.token = token;
    }
    processWebhook(payload, res, SendbirdDesk) {
        const user_id = payload.message.from.id;
        const chat_id = payload.message.chat.id;
        const sendbird_id = `telegram_${chat_id}_${user_id}`;
        const message = payload.message.text;
        const nickname = payload.message.from.first_name+" "+payload.message.from.last_name;
        return SendbirdDesk.processMessage(sendbird_id,message,nickname,{"telegram":chat_id.toString()}).then(result=>res.send(result))
    }
    sendMessage(chat_id, message) {
        console.log("TELEGRAM sendMessage",{chat_id,message});
        var authOptions = {
            method: 'POST',
            url: `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
            data: {
                "chat_id": chat_id,
                "text": message
            },
            json: true
        };
        return axios(authOptions).then(res => {
            console.log("TELEGRAM MESSAGE SENT!");
            return "TELEGRAM MESSAGE SENT! ";
        }).catch(error => {
            console.log("TELEGRAM MESSAGE ERROR",error);
            return false
        })
    }
}
var telegram = new Telegram();
module.exports = telegram
