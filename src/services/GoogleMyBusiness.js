
const axios = require('axios');
class GoogleMyBusiness {
    constructor() {
    }
    processWebhook(payload, res, SendbirdDesk) {
        console.log("GoogleMyBusiness.processWebhook", payload[0]);
        if (!payload) return res.send("No Payload");
        let messageData = payload?.message;
        if (!messageData) return res.send("No Message");
        const conversationId = payload.conversationId;
        const agent = payload.agent;
        if (!payload?.context?.userInfo?.displayName) return res.send("No Sender");
        const message = messageData.text;
        const from_name = payload.context.userInfo.displayName.toLowerCase().replace([/[^a-z0-9]/,"-"]);
        const sendbird_id = `google_${conversationId}_${from_name}`;
        const nickname = payload.context.userInfo.displayName;
        console.log(SendbirdDesk);
        return SendbirdDesk.processMessage(sendbird_id, message, nickname, { "gmb_agent": agent, "conversationId": conversationId }).then(result => res.send(result))

    }
    sendMessage(sender, message, channel) {
        return null
    }
}
var gmb = new GoogleMyBusiness();
module.exports = gmb
