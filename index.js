/**
 * Version: 0.1.0 
 * Made by Loggeru
 */
var fs = require('fs');

const DEBUG = true,
    skills = require('./skills'),
    config = require('./config.json'),
    Command = require('command');

module.exports = function LetMeTarget(dispatch) {
    const command = Command(dispatch);

    let enabled = true,
        needHeal = [],
        ownId = null,
        cid = null,
        model = null,
        job = null,
        partyMembers = null,
        ownX = null,
        ownY = null,
        ownZ = null,
        ownAlive = false;

    let lockdelay = config.delay_lockon.on || true,
        lockmin = config.delay_lockon.min || 200,
        lockmax = config.delay_lockon.max || 700;

    dispatch.hook('S_LOGIN', 2, (event) => {
        ownId = event.playerId;
        cid = event.cid;
        model = event.model;
        job = (model - 10101) % 100;
    });

    command.add('lockon', (func, value1, value2) => {
        if (func == 'on') {
            enabled = true;
            command.msg('Let me Lock is ENABLED');
        } else if (func == 'off') {
            enabled = false;
            command.msg('Let me Lock is DISABLED');
        }
        
    });

    dispatch.hook('S_SPAWN_ME', 1, event => {
        ownAlive = event.alive
    });

    dispatch.hook('S_PARTY_MEMBER_LIST', 5, (event) => {

        partyMembers = [];

        for (let party of event.members) {
            if (party.playerId != ownId) {

                partyMembers.push({
                    playerId: party.playerId,
                    cid: party.cid,
                    online: party.online,
                    hpP: party.online ? 100 : 0,
                    debuff: false,
                    x: null,
                    y: null,
                    z: null,
                    name: party.name
                });

            }
        }

    });

    dispatch.hook('S_LEAVE_PARTY', 1, (event) => {
        partyMembers = [];
    });

    dispatch.hook('S_LEAVE_PARTY_MEMBER', 2, (event) => {

        partyMembers = partyMembers.filter(function (p) {
            return p.playerId != event.playerId;
        });

    });

    dispatch.hook('S_PARTY_MEMBER_CHANGE_HP', 2, (event) => {

        for (let i = 0; i < partyMembers.length; i++) {
            if (partyMembers[i].playerId == event.playerId) {
                partyMembers[i].hpP = Math.round(event.currentHp / event.maxHp * 100);
                break;
            }
        }

    });

    dispatch.hook('S_LOGOUT_PARTY_MEMBER', 1, (event) => {

        for (let i = 0; i < partyMembers.length; i++) {
            if (partyMembers[i].playerId == event.playerId) {
                partyMembers[i].online = false;
                break;
            }
        }

    });

    dispatch.hook('S_USER_LOCATION', 1, { order: -10 }, (event) => {

        if (partyMembers != null) {
            for (let i = 0; i < partyMembers.length; i++) {
                if (partyMembers[i].cid.equals(event.target)) {
                    partyMembers[i].x = (event.x1 + event.x2) / 2;
                    partyMembers[i].y = (event.y1 + event.y2) / 2;
                    partyMembers[i].z = (event.z1 + event.z2) / 2;
                    break;
                }
            }
        }

    })

    dispatch.hook('C_PLAYER_LOCATION', 1, { order: -10 }, event => {
        ownX = (event.x1 + event.x2) / 2;
        ownY = (event.y1 + event.y2) / 2;
        ownZ = (event.z1 + event.z2) / 2;
    });

    dispatch.hook('C_START_SKILL', 3, { order: -10 }, (event) => {

        if (!enabled) return;

        let packetSkillInfo = skills.find(o => o.id == event.skill);
        if (packetSkillInfo && packetSkillInfo.job == job) {

            if (packetSkillInfo.type == 'heal' && partyMembers.length > 0) {

                sortHp();
                let qtdTarget = 0;
                for (let i = 0; i < partyMembers.length; i++) {
                    let distance = checkDistance(ownX, ownY, ownZ, partyMembers[i].x, partyMembers[i].y, partyMembers[i].z);

                    if (partyMembers[i].hpP > 0 && partyMembers[i].hpP < 100 && distance <= 35 && qtdTarget <= packetSkillInfo.targets) {
                        let newEvent = {
                            target: partyMembers[i].cid,
                            unk: 0,
                            skill: event.skill
                        }
                        setTimeout(function () {
                            dispatch.toServer('C_CAN_LOCKON_TARGET', 1, newEvent);
                            setTimeout(function () {
                                dispatch.toClient('S_CAN_LOCKON_TARGET', 1, Object.assign({ ok: true }, newEvent));
                            }, 20);
                        }, lockdelay ? dRandom() : 0);
                        qtdTarget++;
                    }

                }

            } else if (packetSkillInfo.type == 'cleanse' && partyMembers != null) {

                let qtdTarget = 0;
                for (let i = 0; i < partyMembers.length; i++) {
                    let distance = checkDistance(ownX, ownY, ownZ, partyMembers[i].x, partyMembers[i].y, partyMembers[i].z);

                    if (distance <= 35 && qtdTarget <= packetSkillInfo.targets) {
                        let newEvent = {
                            target: partyMembers[i].cid,
                            unk: 0,
                            skill: event.skill
                        }
                        setTimeout(function () {
                            dispatch.toServer('C_CAN_LOCKON_TARGET', 1, newEvent);
                            setTimeout(function () {
                                dispatch.toClient('S_CAN_LOCKON_TARGET', 1, Object.assign({ ok: true }, newEvent));
                            }, 20);
                        }, lockdelay ? dRandom() : 0);
                        qtdTarget++;
                    }

                }

            }

        }
    });

    function sortHp() {
        partyMembers.sort(function (a, b) {
            return parseFloat(a.hpP) - parseFloat(b.hpP);
        });
    }

    function checkDistance(x, y, z, x1, y1, z1) {
        return (Math.sqrt(Math.pow(x1 - x, 2) + Math.pow(y1 - y, 2) + Math.pow(z1 - z, 2))) / 25;
    }

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

    }

    function dRandom() {
        return Math.floor(Math.random() * (lockmax - lockmin)) + lockmin;
    }
}