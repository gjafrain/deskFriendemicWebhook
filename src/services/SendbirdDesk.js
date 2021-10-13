const axios = require('axios');
const { AppID, SendbirdDeskApiToken } = require('../utils/sendBirdConfig');
const { sendSuccessMessage } = require('../utils/common');
const SendbirdChat = require('./SendbirdChat');
class SendbirdDesk {
    constructor(app_id, token) {
        this.app_id = app_id;
        this.token = token;
        this.DeskHeaders = {
            "SENDBIRDDESKAPITOKEN": this.token,
            "Content-Type": "application/json"
        };
        this.defaultWaitTime = 60;
        this.defaultTeamKey = "friendemic";
        this.defaultStatus = "PENDING";
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
        if (!data.results[0]) return false;
        console.log("SendbirdDesk.identifyActiveTicket", data.results[0].id);
        for (let i in data.results) {
            let ticket = data.results[i];
            if (ticket.closeStatus === "NOT_CLOSED") return ticket;
        }
        return false;
    }
    processMessage(sendbird_id, message, nickname, src) {
        console.log("SendbirdDesk.processMessage", { sendbird_id, message, src })
        return this.getCustomer(sendbird_id, nickname).then(customerObj => this.getActiveTicket(customerObj.sendbirdId).then(ticket => {
            if (!ticket) return this.createTicket(sendbird_id, message, nickname, src);
            return this.updateTicket(ticket, sendbird_id, message);
        }));
    }
    createTicket(sendbird_id, message, nickname, src) {
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
                SendbirdChat.setChannelMetadata(channel, src);
                return SendbirdChat.sendMessage(channel, sendbird_id, message)
            }).catch(e => console.log("createTicket FAILURE", (e.response ? e.response.data : e)));
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
            if (res.data.count >= 1) return res.data.results[0];
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
    // TICKET ROUTING FUNCTIONS
    processWebhook(payload, res) {
        // console.log('TICKET ROUTE PAYLOAD ---', payload)
        if (payload.eventType !== "TICKET.STATUS.UPDATED") return sendSuccessMessage("eventType: " + payload.eventType, res);
        console.log("SendbirdDesk.processWebhook",payload)
        let ticketId = payload.data.id;
        let groupId = payload.data.group.id;
        let teamKey = payload.data.group.key;
        let waitTime = this.loadWaitTime(payload.data.group);
        if (teamKey === this.defaultTeamKey) return sendSuccessMessage("teamKey: " + teamKey, res);
        return this.startTimer(ticketId, groupId, waitTime, res);
    }
    loadWaitTime(group) {
        //console.log("SendbirdDesk.loadWaitTime")
        try {
            let data = JSON.parse(group.description);
            return (data.waitTime) ? data.waitTime : this.defaultWaitTime;
        } catch (e) {
            return this.defaultWaitTime;
        }
    }
    async startTimer(ticketId, groupId, waitTime, res) {
        //  console.log("SendbirdDesk.startTimer", { ticketId, groupId, waitTime })
        const isOnline = await this.teamAgentsOnlineStatus(groupId)
        // check if team agent is online then Ticket will assign to admin on specific time else immediately  
        if (isOnline) {
            console.log("[TICKET-" + ticketId + "] STARTING A " + waitTime + " SEC TIMER");
            setTimeout(() => {
                this.ticketStillUnassigned(ticketId,res).then(stillPending => {
                    if (stillPending) this.transferTicket(ticketId);
                });
            }, waitTime * 1000)
        } else {
            console.log("[TICKET-" + ticketId + "] TRANSFERRED");
            this.transferTicket(ticketId);
            return sendSuccessMessage("[TICKET-" + ticketId + "] TRANSFERRED", res);
        }
    }
    ticketStillUnassigned(ticketId,topres) {
        console.log("[TICKET-" + ticketId + "] CHECKING TICKET STATUS...");
        var authOptions = {
            method: 'GET',
            url: "https://desk-api-" + this.app_id + ".sendbird.com/platform/v1/tickets/" + ticketId,
            headers: this.DeskHeaders,
            json: true
        };
        return axios(authOptions).then(res => {
            // console.log("check Res",res);
            console.log("[TICKET-" + ticketId + "] STATUS: " + res.data.status2);
            console.log("[TICKET-" + ticketId + "] TEAM: " + res.data.group.key);
            if (res.data.group.key === this.defaultTeamKey) {
                console.log("[TICKET-" + ticketId + "] ALREADY ASSIGNED TO: " + this.defaultTeamKey);
                return false;
            }
            if (res.data.status2 === "PENDING") {
                console.log("[TICKET-" + ticketId + "] NEEDS TO BE ASSIGNED TO: " + this.defaultTeamKey);
                sendSuccessMessage("[TICKET-" + ticketId + "] NEEDS TO BE ASSIGNED TO: " + this.defaultTeamKey, topres);
                return false;
            }
            else console.log("[TICKET-" + ticketId + "] NEEDS NO REASSIGNMENT");
            sendSuccessMessage("[TICKET-" + ticketId + "] NEEDS NO REASSIGNMENT", topres);
            return false;
        }).catch(e => {
            console.log("[TICKET-" + ticketId + "] FAILED TO CHECK TICKET", e.response);
            console.error("ERROR --", e)
            sendSuccessMessage("[TICKET-" + ticketId + "] FAILED TO CHECK TICKET", topres);
            return null
        })
    }
    teamAgentsOnlineStatus(group_id) {
        var authOptions = {
            method: 'GET',
            url: "https://desk-api-" + this.app_id + ".sendbird.com/platform/v1/groups/" + group_id,
            headers: this.DeskHeaders,
            json: true
        };
        return axios(authOptions).then(res => {
            return res.data.members.filter(member => member.connection === "ONLINE").length
        }).catch(error => {
            console.log("[GROUP -" + group_id + "] FAILED TO GET AGENTS ");
            console.error(error.response.data)
            return false
        })
    }
    transferTicket(ticketId) {
        console.log("[TICKET-" + ticketId + "] TRANSFERING to " + this.defaultTeamKey)
        var authOptions = {
            method: 'POST',
            url: "https://desk-api-" + this.app_id + ".sendbird.com/platform/v1/tickets/transfer_to_group",
            data: JSON.stringify({
                tickets: [ticketId],
                status: this.defaultStatus,
                groupKey: this.defaultTeamKey
            }),
            headers: this.DeskHeaders,
            json: true
        };
        return axios(authOptions).then(res => {
            if (res.data.transferredTickets) {
                console.log("[TICKET-" + ticketId + "] TRANSFER SUCCESS");
                return res.transferredTickets;
            }
            return false;
        }).catch(error => {
            //console.error(error)
            console.log("[TICKET-" + ticketId + "] FAILED TO TRANSFER TICKET ");
            console.error(error.response.data)
            return false
        })
    }
    //TICKET CLEANUP
    closeOpenTickets(res) {
        console.log("SendbirdDesk.closeOpenTickets")
        this.listTicketsofStatus("PENDING")
            .then(tickets => this.listTicketsofStatus("ACTIVE", tickets))
            .then(tickets => {
                tickets.map(ticket => this.closeTicket(ticket.id));
                sendSuccessMessage("Closing Tickets " + tickets.map(ticket => ticket.id).join(", "), res)
            });
    }
    listTicketsofStatus(status, appendTo) {
        console.log("SendbirdDesk.listTicketsofStatus",{status})
        if (!Array.isArray(appendTo)) appendTo = [];
        var authOptions = {
            method: 'GET',
            url: "https://desk-api-" + this.app_id + ".sendbird.com/platform/v1/tickets?status2=" + status,
            headers: this.DeskHeaders,
            json: true
        };
        return axios(authOptions).then(res => {
            return [...appendTo, ...res.data.results]
        }).catch(error => {
            return appendTo;
        })
    }
    closeTicket = (ticketId, res) => {
        console.log("SendbirdDesk.closeTicket",{ticketId})
        var authOptions = {
            method: 'PATCH',
            url: "https://desk-api-" + AppID + ".sendbird.com/platform/v1/tickets/" + ticketId + "/close",
            headers: this.DeskHeaders,
            json: true,
            data: JSON.stringify({
                "closeComment": "Closed By Admin, Manually",
                "closeMessage": "Closed By Admin, Manually"
            }),
        };
        axios(authOptions).then(requestIdleCallback => {
            console.log("[TICKET-" + ticketId + "] CLOSED SUCCESS")
            if (res) sendSuccessMessage("[TICKET-" + ticketId + "] CLOSED SUCCESSFULLY", res)
        }).catch(error => {
            console.log("[TICKET-" + ticketId + "] FAILED TO CLOSE TICKET: ",error.response.data.detail);
            if (res) sendSuccessMessage(error.response.data.detail, res)
        })
    }
}
var desk = new SendbirdDesk(AppID, SendbirdDeskApiToken);
module.exports = desk
