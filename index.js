/**
 * Version: 0.0.8 (beta)
 * 
 * DONE:
 * Cleanse all party members up to 4
 * Heal low hp members up to 4
 * 
 * TODO:
 * Toggle: target all or only low hp
 * Healing Immersion
 * Auto-lock first target
 */
var fs = require('fs');

const DEBUG = true,
    SKILLS = [{
        id: 67159764, // mystic basic heal
        job: 7,
        heal: true,
        targets: 4
    },
    {
        id: 67299764, // priest basic heal
        job: 6,
        heal: true,
        targets: 4
    },
    {
        id: 67198964, // mystic cleanse
        heal: false,
        job: 7,
        targets: 4
    }]

const Command = require('command');

module.exports = function LetMeTarget(dispatch) {
    const command = Command(dispatch);

    let enabled = true,
        needHeal = [],
        ownId = null,
        cid = null,
        model = null,
        job = null,
        partyMembers = null;

    dispatch.hook('S_LOGIN', 2, (event) => {
        ownId = event.playerId;
        cid = event.cid;
        model = event.model;
        job = (model - 10101) % 100;
        //message('Job: ' + job);
    });

    dispatch.hook('S_PARTY_MEMBER_LIST', 5, (event) => {

        partyMembers = [];

        for (let party of event.members) {
            if (party.playerId != ownId) {
                partyMembers.push(party);
            }
        }

    });

    dispatch.hook('S_LEAVE_PARTY', 1, (event) => {
        partyMembers = [];
    });

    dispatch.hook('S_LEAVE_PARTY_MEMBER', 1, (event) => {
        if (partyMembers.includes(event.playerId)) {
            let index = partyMembers.indexOf(event.playerId);
            partyMembers.splice(index, 1);
        }

        if (partyMembers.length > 0) {
            partyMembers.filter(onlyUnique);
        }
    });

    // Check if HP from that member have changed
    dispatch.hook('S_PARTY_MEMBER_CHANGE_HP', 2, (event) => {

        // If low hp and not dead
        if ((event.maxHp - event.currentHp) != 0 && event.currentHp > 0 && event.playerId != ownId && !needHeal.includes(event.playerId)) {
            needHeal.push(event.playerId);
        }

        // if full hp
        if (event.currentHp == event.maxHp && needHeal.includes(event.playerId)) {
            let index = needHeal.indexOf(event.playerId);
            needHeal.splice(index, 1);
        }

        // clean duplicates names if needed
        if (needHeal.length > 0) {
            needHeal.filter(onlyUnique);
        }
    })

    // Check if dead and get off of the list
    dispatch.hook('S_PARTY_MEMBER_STAT_UPDATE', 2, (event) => {
        if (event.curHp == 0 && needHeal.includes(event.playerId)) {
            let index = needHeal.indexOf(event.playerId);
            needHeal.splice(index, 1);
        }

        // clean duplicates names if needed
        if (needHeal.length > 0) {
            needHeal.filter(onlyUnique);
        }
    });

    dispatch.hook('S_ACTION_END', 1, { order: -10 }, (event) => {
        //if (DEBUG) message('Skill Id: ' + event.skill);

        let packetSkillInfo = SKILLS.find(o => o.id == event.skill);
        if (packetSkillInfo && event.source.equals(cid) && packetSkillInfo.job == job) {

            if (packetSkillInfo.heal && needHeal.length > 0) {

                for (let m of needHeal) {

                    var memberInfo = partyMembers.find(o => o.playerId === m);
                    if (memberInfo != null) {
                        let newEvent = {
                            target: memberInfo.cid,
                            unk: 0,
                            skill: event.skill
                        }
                        dispatch.toServer('C_CAN_LOCKON_TARGET', 1, newEvent);
                        dispatch.toClient('S_CAN_LOCKON_TARGET', 1, Object.assign({ ok: true }, newEvent));
                        //if (DEBUG) message('Target name: ' + memberInfo.name);
                    }

                }

            } else if (packetSkillInfo.heal == false && partyMembers != null) {

                for (let p of partyMembers) {

                    let newEvent = {
                        target: p.cid,
                        unk: 0,
                        skill: event.skill
                    }
                    dispatch.toServer('C_CAN_LOCKON_TARGET', 1, newEvent);
                    dispatch.toClient('S_CAN_LOCKON_TARGET', 1, Object.assign({ ok: true }, newEvent));
                }

            }

        }
    });

    function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    function message(msg, chat = false) {
        if (chat == true) {
            dispatch.toClient('S_CHAT', 1, {
                channel: 24,
                authorID: 0,
                unk1: 0,
                gm: 0,
                unk2: 0,
                authorName: '',
                message: '(Let Me Target) ' + msg
            });
        } else {
            console.log('(Let Me Target) ' + msg);
        }

    };
}