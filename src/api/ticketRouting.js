

const axios = require('axios');
const { sendSuccessMessage } = require('../utils/common');
const { AppID, SendbirdDeskApiToken } = require('../utils/sendBirdConfig');

const defaultTeam = "friendemic";
const defaultStatus = "PENDING";

const teamConfig = {
    "friendemic": null,
    "dealer-a": 30,
    "dealer-b": 50
}

class TicketRouting {
    constructor(app_id, access) {
        this.app_id = app_id;
        this.access = access;
    }

    processWebhook(payload, res) {

        // console.log('TICKET ROUTE PAYLOAD ---', payload)

        if (payload.eventType !== "TICKET.STATUS.UPDATED") return sendSuccessMessage("eventType: " + payload.eventType, res);
        let ticketId = payload.data.id;
        let teamKey = payload.data.group.key;
        let groupId = payload.data.group.id;
        if (teamKey === defaultTeam) return sendSuccessMessage("teamKey: " + teamKey, res);
        return this.startTimer(ticketId, teamKey, groupId, res);
    }

    loadWaitTime(teamKey) {
        return teamConfig[teamKey] || 60;
    }

    async startTimer(ticketId, teamKey, groupId, res) {

        const isOnline = await this.teamAgentsOnlineStatus(groupId)
        // check if team agent is online then Ticket will assign to admin on specific time else immediately  
        if (isOnline) {
            let waitTime = this.loadWaitTime(teamKey);
            console.log("[TICKET-" + ticketId + "] STARTING A " + waitTime + " SEC TIMER");
            setTimeout(() => {
                this.ticketStillUnassigned(ticketId).then(stillPending => {
                    console.log('STILL PENDING ---', stillPending)
                    if (stillPending) this.transferTicket(ticketId);
                });
            }, waitTime * 1000)
        } else {
            console.log("[TICKET-" + ticketId + "] TRANSFERRED");
            this.transferTicket(ticketId);
            return sendSuccessMessage("[TICKET-" + ticketId + "] TRANSFERRED", res);
        }
    }

    ticketStillUnassigned(ticketId) {
        console.log("[TICKET-" + ticketId + "] CHECKING TICKET STATUS...");
        var authOptions = {
            method: 'GET',
            url: "https://desk-api-" + this.app_id + ".sendbird.com/platform/v1/tickets/" + ticketId,
            headers: {
                "SENDBIRDDESKAPITOKEN": this.access,
                "Content-Type": "application/json"
            },
            json: true
        };
        return axios(authOptions).then(res => {
            // console.log("check Res",res);
            console.log("[TICKET-" + ticketId + "] STATUS: " + res.data.status2);
            console.log("[TICKET-" + ticketId + "] TEAM: " + res.data.group.key);
            if (res.data.group.key === defaultTeam) {
                console.log("[TICKET-" + ticketId + "] ALREADY ASSIGNED TO: " + defaultTeam);
                return false;
            }
            if (res.data.status2 === "PENDING") {
                console.log("[TICKET-" + ticketId + "] NEEDS TO BE ASSIGNED TO: " + defaultTeam);
                return true;
            }
            else console.log("[TICKET-" + ticketId + "] NEEDS NO REASSIGNMENT");
            return false;
        }).catch(error => {
            console.log("[TICKET-" + ticketId + "] FAILED TO CHECK TICKET");
            console.error("ERROR --", error.response)
            return null
        })
    }

    teamAgentsOnlineStatus(group_id) {
        var authOptions = {
            method: 'GET',
            url: "https://desk-api-" + this.app_id + ".sendbird.com/platform/v1/groups/" + group_id,
            headers: {
                "SENDBIRDDESKAPITOKEN": this.access,
                "Content-Type": "application/json"
            },
            json: true
        };
        return axios(authOptions).then(res => {
            return res.data.members.filter(member => member.connection === "ONLINE").length
        }).catch(error => {
            //console.error(error)
            console.log("[GROUP -" + group_id + "] FAILED TO GET AGENTS ");
            console.error(error.response.data)
            return false
        })
    }

    transferTicket(ticketId) {
        console.log("[TICKET-" + ticketId + "] TRANSFERING to " + defaultTeam)
        var authOptions = {
            method: 'POST',
            url: "https://desk-api-" + this.app_id + ".sendbird.com/platform/v1/tickets/transfer_to_group",
            data: JSON.stringify({
                tickets: [ticketId],
                status: defaultStatus,
                groupKey: defaultTeam
            }),
            headers: {
                "SENDBIRDDESKAPITOKEN": this.access,
                "Content-Type": "application/json"
            },
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
}

var ticketRouting = new TicketRouting(AppID, SendbirdDeskApiToken);

module.exports = ticketRouting
