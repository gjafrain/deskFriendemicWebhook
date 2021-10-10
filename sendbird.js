

const axios = require('axios')


const defaultTeam = "friendemic";
const defaultStatus = "PENDING";

const teamConfig = {
    "friendemic": null,
    "dealer-a": 30,
    "dealer-b": 50
}

class Sendbird {
    constructor(app_id, access) {
        this.app_id = app_id;
        this.access = access;
    }

    processWebhook(payload,res) {
        if (payload.eventType !== "TICKET.STATUS.UPDATED") return "eventType: "+payload.eventType;
        let ticketId = payload.data.id;
        let teamKey = payload.data.group.key;
        if (teamKey === defaultTeam) return "teamKey: "+teamKey;
        return this.startTimer(ticketId, teamKey);
    }

    loadWaitTime(teamKey) {
        return teamConfig[teamKey] || 60;
    }

    startTimer(ticketId, teamKey) {
        let waitTime = this.loadWaitTime(teamKey);
        console.log("[TICKET-" + ticketId + "] STARTING A "+waitTime+" SEC TIMER");
        setTimeout(() => {
            this.ticketStillUnassigned(ticketId).then(stillPending => {
                console.log('stillPending...',stillPending)
                if (stillPending) this.transferTicket(ticketId);
            });

        }, waitTime * 1000)
        // return "[TICKET-" + ticketId + "] Timer started on for " + teamKey + ` (${waitTime} seconds)`;
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
            console.log("[TICKET-" + ticketId + "] STATUS: "+res.data.status2);
            console.log("[TICKET-" + ticketId + "] TEAM: "+res.data.group.key);
            if(res.data.group.key===defaultTeam)
            {
                console.log("[TICKET-" + ticketId + "] ALREADY ASSIGNED TO: "+defaultTeam);
                return false;
            }
            if (res.data.status2 === "PENDING") 
            {
                console.log("[TICKET-" + ticketId + "] NEEDS TO BE ASSIGNED TO: "+defaultTeam);
                return true;
            }
            else console.log("[TICKET-" + ticketId + "] NEEDS NO REASSIGNMENT");
            return false;
        }).catch(error => {
            console.log("[TICKET-" + ticketId + "] FAILED TO CHECK TICKET");
            console.error("ERROR --",error.response)
            return null
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
            if (res.transferredTickets){
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

var sendbird = new Sendbird("74563782-DCA0-4652-B947-A11D5E8A1322", "73d8c567d587342e60c8167df04c682ca5d6efdb");

module.exports = sendbird
