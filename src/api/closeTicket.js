
const axios = require('axios');
const { sendSuccessMessage } = require('../utils/common');
const { AppID, SendbirdDeskApiToken } = require('../utils/sendBirdConfig');

exports.closeTicket = (payload, res) => {
    const { ticketId } = payload
        var authOptions = {
            method: 'PATCH',
            url: "https://desk-api-" + AppID + ".sendbird.com/platform/v1/tickets/" + ticketId + "/close",
            headers: {
                "SENDBIRDDESKAPITOKEN": SendbirdDeskApiToken,
                "Content-Type": "application/json"
            },
            json: true,
            data: JSON.stringify({
                "closeComment": "Closed By Admin, Manually",
                "closeMessage": "Closed By Admin, Manually"
            }),
        };
        axios(authOptions).then(respponse => {
            console.log("[TICKET -" + ticketId + "] CLOSED SUCCESS")
             sendSuccessMessage("[TICKET -" + ticketId + "] CLOSED SUCCESS", res)
        }).catch(error => {
            console.log("[TICKET -" + ticketId + "] FAILED TO CLOSED TICKET");
            console.log(error.response.data.detail)
            sendSuccessMessage(error.response.data.detail, res)
    })
}
