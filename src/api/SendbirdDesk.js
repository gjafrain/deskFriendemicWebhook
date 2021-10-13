const axios = require('axios');
const { AppID, SendbirdDeskApiToken } = require('../utils/sendBirdConfig');
const SendbirdChat = require('./SendbirdChat');
class SendbirdDesk {
    constructor(app_id, token) {
        this.app_id = app_id;
        this.token = token;
        this.DeskHeaders = {
            "SENDBIRDDESKAPITOKEN": this.token,
            "Content-Type": "application/json"
        };
    }


    processMessage(sendbird_id, message, src) {
    }


    getActiveTicket(sendbird_id) {
        console.log("SendbirdDesk.getActiveTicket", { sendbird_id })
        var authOptions = {
            method: 'GET',
            url: `https://desk-api-${this.app_id}.sendbird.com/platform/v1/tickets?sendbird_id=${sendbird_id}`,
            json: true,
            headers: this.DeskHeaders,
        };
        return axios(authOptions).then(res => {
            return this.identifyActiveTicket(res.data);
        }).catch(e => console.log("getActiveTicket FAILURE", e));

    }

    identifyActiveTicket(data) {
        
        if(!data.results[0]) return false;
        console.log("SendbirdDesk.identifyActiveTicket", data.results[0].id);
        for (let i in data.results) {
            let ticket = data.results[i];
            if (ticket.closeStatus === "NOT_CLOSED") return ticket;
        }
        return false;
    }


    processMessage(sendbird_id, message, nickname, src ) {
        console.log("SendbirdDesk.processMessage", { sendbird_id, message, src })
        return this.getCustomer(sendbird_id, nickname).then(customerObj => this.getActiveTicket(customerObj.sendbirdId).then(ticket => {
            if (!ticket) return this.createTicket(sendbird_id, message, nickname, src);
            return this.updateTicket(ticket, sendbird_id, message);
        }));
    }


    createTicket(sendbird_id, message,  nickname, src) {
        console.log("SendbirdDesk.createTicket", { sendbird_id, message, src })
        return this.getCustomer(sendbird_id, nickname).then(customerObj => {
            let customerId = customerObj.id;
            var authOptions = {
                method: 'POST',
                url: `https://desk-api-${this.app_id}.sendbird.com/platform/v1/tickets`,
                data: {
                    "channelName": `Ticket Started By: ${sendbird_id}`,
                    "customerId": customerId,
                    "customFields": JSON.stringify({ src: src })
                },
                json: true,
                headers: this.DeskHeaders,
            };
            return axios(authOptions).then(ticket => {
                let channel = ticket.data.channelUrl;
                SendbirdChat.setChannelMetadata(channel,src);
                
                return SendbirdChat.sendMessage(channel, sendbird_id, message)
            }).catch(e => console.log("createTicket FAILURE",(e.response ? e.response.data : e)));
        });
    }


    updateTicket(ticket, sendbird_id, message) {
        console.log("SendbirdDesk.updateTicket", ticket.id, { sendbird_id, message });
        let channel = ticket.channelUrl;
        return SendbirdChat.sendMessage(channel, sendbird_id, message);
    }


    getCustomer(sendbird_id, nickname) {
        console.log("SendbirdDesk.getCustomer", { sendbird_id })
        var authOptions = {
            method: 'GET',
            url: `https://desk-api-${this.app_id}.sendbird.com/platform/v1/customers?sendbird_id=${sendbird_id}`,
            headers: this.DeskHeaders,
        };
        return axios(authOptions).then(res => {
            if(res.data.count >= 1) return res.data.results[0];
            return this.createCustomer(sendbird_id, nickname);
        }).catch(e => {
            console.log("getCustomer FAILURE ", (e.response?.data ? e.response.data : e));
            return this.createCustomer(sendbird_id, nickname);
        });
    }


    createCustomer(sendbird_id, nickname) {
        console.log("SendbirdDesk.createCustomer", { sendbird_id })
        return SendbirdChat.getUser(sendbird_id, nickname).then(sendbird_id => {
            console.log("SendbirdDesk.createCustomer (confirmed)", { sendbird_id })
            var authOptions = {
                method: 'POST',
                url: `https://desk-api-${this.app_id}.sendbird.com/platform/v1/customers`, data: {
                    "sendbirdId": sendbird_id
                },
                json: true,
                headers: this.DeskHeaders,
            };
            return axios(authOptions)
                .then(customer => customer.data)
                .catch(e => {
                    console.log("createCustomer FAILURE", (e.response.data))
                    return {};
                });
        })
    }
}
var desk = new SendbirdDesk(AppID, SendbirdDeskApiToken);
module.exports = desk
