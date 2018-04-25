/**
 * Version: 0.2.10
 * Made by Loggeru
 */
var fs = require('fs');

const skills = require('./skills'),
    config = require('./config.json'),
    Command = require('command');

module.exports = function LetMeTarget(dispatch) {
    const command = Command(dispatch);

    let enabled = true,
        ownId = null,
        cid = null,
        model = null,
        job = null,
        partyMembers = null,
        ownX = null,
        ownY = null,
        ownZ = null,
        ownAlive = false,
        locking = false,
        bossInfo = [];

    let lockDelay = config.delay_lockon.on || true,
        lockmin = config.delay_lockon.min || 50,
        lockmax = config.delay_lockon.max || 300,
        smartC = config.cleanse.smartC || true,
        autoDps = config.dps.auto || false,
        autoDpsDelay = config.dps.delay || 350;

    dispatch.hook('S_LOGIN', 10, (event) => {
        ownId = event.playerId;
        cid = event.gameId;
        model = event.templateId;
        job = (model - 10101) % 100;
    });

    command.add('letmelock', () => {
        enabled = !enabled;
        let txt = (enabled) ? 'ENABLED' : 'DISABLED';
        message('Let me Lock is ' + txt, true);
    });

    command.add('lockhuman', () => {
        lockDelay = !lockDelay;
        let txt = (lockDelay) ? 'ENABLED' : 'DISABLED';
        message('Human Behavior is ' + txt, true);
    });

    command.add('smartc', () => {
        smartC = !smartC;
        let txt = (smartC) ? 'ENABLED' : 'DISABLED';
        message('Smart Cleanse is ' + txt, true);
    });

    /*command.add('l1', () => {
        sortDistBoss();
        message(JSON.stringify(bossInfo, null, 4));
    });

    command.add('l2', () => {
        sortHp();
        message(JSON.stringify(partyMembers, null, 4));
    });*/

    command.add('autodps', (v1) => {
        if (v1 != null) {
            v1 = parseInt(v1);
            autoDpsDelay = v1;
            message('Auto DPS Delay changed to ' + v1, true);
        } else {
            autoDps = !autoDps;
            let txt = (autoDps) ? 'ENABLED' : 'DISABLED';
            message('Auto DPS is ' + txt, true);
        }
    });

    dispatch.hook('S_SPAWN_ME', 2, event => {
        ownAlive = event.alive
    });

    dispatch.hook('S_PARTY_MEMBER_LIST', 6, (event) => {

        partyMembers = [];

        for (let party of event.members) {
            if (party.playerId != ownId) {

                partyMembers.push({
                    playerId: party.playerId,
                    cid: party.gameId,
                    online: party.online,
                    hpP: party.online ? 100 : 0,
                    curHp: 0,
                    debuff: false,
                    debId: [],
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
        bossInfo = [];
        locking = false;
    });

    dispatch.hook('S_LEAVE_PARTY_MEMBER', 2, (event) => {

        partyMembers = partyMembers.filter(function (p) {
            return p.playerId != event.playerId;
        });

    });

    dispatch.hook('S_PARTY_MEMBER_CHANGE_HP', 3, (event) => {

        for (let i = 0; i < partyMembers.length; i++) {
            if (partyMembers[i].playerId == event.playerId) {
                partyMembers[i].hpP = Math.round(event.currentHp / event.maxHp * 100);
                partyMembers[i].curHp = event.currentHp;
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

    dispatch.hook('S_USER_LOCATION', 4, { order: -10 }, (event) => {

        if (partyMembers != null) {
            for (let i = 0; i < partyMembers.length; i++) {
                if (partyMembers[i].cid.equals(event.gameId)) {
                    partyMembers[i].x = (event.loc.x + event.dest.x) / 2;
                    partyMembers[i].y = (event.loc.y + event.dest.y) / 2;
                    partyMembers[i].z = (event.loc.z + event.dest.z) / 2;
                    break;
                }
            }
        }

    })

    dispatch.hook('C_PLAYER_LOCATION', 5, { order: -10 }, (event) => {
        ownX = (event.loc.x + event.dest.x) / 2;
        ownY = (event.loc.y + event.dest.y) / 2;
        ownZ = (event.loc.z + event.dest.z) / 2;
    });

    dispatch.hook('S_ABNORMALITY_BEGIN', 2, { order: -10 }, (event) => {
        if (event.source.low == 0 || event.source.high == 0 || event.target.equals(event.source) || partyMembers == null || event.source.equals(cid)) return;
        for (let y = 0; y < partyMembers.length; y++) {
            if (partyMembers[y].cid.equals(event.source)) return;
        }

        for (let i = 0; i < partyMembers.length; i++) {
            if (partyMembers[i].cid.equals(event.target)) {
                partyMembers[i].debuff = true;
                partyMembers[i].debId.push(event.id);
                break;
            }
        }

    })

    dispatch.hook('S_ABNORMALITY_END', 1, { order: -10 }, (event) => {
        if (partyMembers == null) return

        for (let i = 0; i < partyMembers.length; i++) {
            if (partyMembers[i].cid.equals(event.target)) {

                let newDebId = [];
                for (let x = 0; x < partyMembers[i].debId.length; x++) {
                    if (partyMembers[i].debId[x] != event.id) newDebId.push(event.id);
                }
                partyMembers[i].debId = newDebId;
                if (newDebId.length <= 0) partyMembers[i].debuff = false;

                break;
            }
        }

    });

    dispatch.hook('S_BOSS_GAGE_INFO', 3, { order: -10 }, (event) => {

        let alreadyHaveBoss = false;
        let tempPushEvent = {
            id: event.id,
            x: 99999999,
            y: 99999999,
            z: 99999999,
            w: null,
            hp: Math.round(event.curHp / event.maxHp * 100),
            dist: 100
        }
        if (bossInfo.length <= 0) {
            bossInfo.push(tempPushEvent);
        } else {
            for (let b = 0; b < bossInfo.length; b++) {
                if (bossInfo[b].id.equals(event.id)) {
                    bossInfo[b].hp = Math.round(event.curHp / event.maxHp * 100);
                    alreadyHaveBoss = true;
                    if (event.curHp <= 0) {
                        bossInfo = bossInfo.filter(function (p) {
                            return !p.id.equals(event.id);
                        });
                    }
                    break;
                }
            }
            if (alreadyHaveBoss == false) {
                bossInfo.push(tempPushEvent);
            }
        }

    });

    dispatch.hook('S_ACTION_STAGE', 4, { order: -10 }, (event) => {

        if (bossInfo.length <= 0) return;
        for (let b = 0; b < bossInfo.length; b++) {
            if (event.gameId.equals(bossInfo[b].id)) {
                bossInfo[b].x = event.loc.x;
                bossInfo[b].y = event.loc.y;
                bossInfo[b].z = event.loc.z;
                bossInfo[b].w = event.w;
                bossInfo[b].dist = checkDistance(ownX, ownY, ownZ, event.loc.x, event.loc.y, event.loc.z);
                break;
            }
        }

    });

    dispatch.hook('C_START_SKILL', 5, { order: -10 }, (event) => {
        //message(event.skill);
        if (!enabled) return;

        let skillInfo = getSkillInfo(event.skill);
        let packetSkillInfo = skills.find(o => o.group == skillInfo.group && o.job == job);
        if (packetSkillInfo && skillInfo.sub == 10) {
            locking = false;
            if (packetSkillInfo.type == 'cleanse' && partyMembers != null) {
                for (let i = 0; i < partyMembers.length; i++) {
                    partyMembers[i].debuff = false;
                    partyMembers[i].debId = [];
                }
            }
        }

        if (packetSkillInfo && partyMembers != null) {

            if (packetSkillInfo.type == 'heal' && partyMembers.length > 0) {
                sortHp();
                let qtdTarget = 0;
                locking = true;
                for (let i = 0; i < partyMembers.length; i++) {

                    let distance = checkDistance(ownX, ownY, ownZ, partyMembers[i].x, partyMembers[i].y, partyMembers[i].z);
                    if (partyMembers[i].curHp > 0 && partyMembers[i].hpP < 100 && distance <= packetSkillInfo.dist && qtdTarget <= packetSkillInfo.targets) {
                        let newEvent = {
                            target: partyMembers[i].cid,
                            unk: 0,
                            skill: event.skill
                        }
                        doTimeOutLock(newEvent);
                        qtdTarget++;
                    }

                }

            } else if (packetSkillInfo.type == 'cleanse' && partyMembers.length > 0) {
                let qtdTarget = 0;
                locking = true;
                for (let i = 0; i < partyMembers.length; i++) {
                    let distance = checkDistance(ownX, ownY, ownZ, partyMembers[i].x, partyMembers[i].y, partyMembers[i].z);

                    if (partyMembers[i].curHp > 0 && partyMembers[i].hpP <= 100 && distance <= packetSkillInfo.dist && qtdTarget <= packetSkillInfo.targets) {
                        let newEvent = {
                            target: partyMembers[i].cid,
                            unk: 0,
                            skill: event.skill
                        }
                        if (smartC == true && partyMembers[i].debuff == true) {
                            doTimeOutLock(newEvent);
                        }
                        if (smartC == false) {
                            doTimeOutLock(newEvent);
                        }
                        qtdTarget++;
                    }

                }
            } else if ((packetSkillInfo.type == 'dps' || packetSkillInfo.type == 'buff' || packetSkillInfo.type == 'debuff') && bossInfo != null) {

                sortDistBoss();
                locking = true;
                if (bossInfo.length > 0 && bossInfo[0].dist <= packetSkillInfo.dist) {
                    let newEvent = {
                        target: bossInfo[0].id,
                        unk: 0,
                        skill: event.skill
                    }
                    doTimeOutLock(newEvent);
                    if (autoDps) {
                        doSkillActivation(event);
                    }
                }

            }

        }
    });

    dispatch.hook('C_CANCEL_SKILL', 1, { order: -10 }, (event) => {
        let skillInfo = getSkillInfo(event.skill);
        let packetSkillInfo = skills.find(o => o.group == skillInfo.group && o.job == job);
        if (packetSkillInfo && partyMembers != null) {
            locking = false;
        }
    });

    function getSkillInfo(id) {
        // Thanks SP2
        let nid = id -= 0x4000000;
        return {
            id: nid,
            group: Math.floor(nid / 10000),
            level: Math.floor(nid / 100) % 100,
            sub: nid % 100
        };
    }

    function doSkillActivation(event) {
        event.skill = (event.skill + 10);
        setTimeout(function () {
            dispatch.toServer('C_START_SKILL', 5, event);
            locking = false;
        }, autoDpsDelay);
    }

    function doTimeOutLock(event) {
        setTimeout(function () {
            if (locking == true) {
                dispatch.toServer('C_CAN_LOCKON_TARGET', 1, event);
                setTimeout(function () {
                    dispatch.toClient('S_CAN_LOCKON_TARGET', 1, Object.assign({ ok: true }, event));
                }, 50);
            }
        }, lockDelay ? dRandom() : 20);
    }

    function sortHp() {
        partyMembers.sort(function (a, b) {
            return parseFloat(a.hpP) - parseFloat(b.hpP);
        });
    }

    function sortDistBoss() {
        bossInfo.sort(function (a, b) {
            return parseFloat(a.dist) - parseFloat(b.dist);
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
            command.message('(Let Me Target) ' + msg);
        } else {
            console.log('(Let Me Target) ' + msg);
        }
    }

    function dRandom() {
        return Math.floor(Math.random() * (lockmax - lockmin)) + lockmin;
    }
}
