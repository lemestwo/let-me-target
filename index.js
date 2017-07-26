/**
 * Version: 0.2.0
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
        bossInfo = null;

    let lockDelay = config.delay_lockon.on || true,
        lockmin = config.delay_lockon.min || 50,
        lockmax = config.delay_lockon.max || 300,
        smartC = config.cleanse.smartC || true,
        autoDps = config.dps.auto || false,
        autoDpsDelay = config.dps.delay || 350;

    dispatch.hook('S_LOGIN', 2, (event) => {
        ownId = event.playerId;
        cid = event.cid;
        model = event.model;
        job = (model - 10101) % 100;
    });

    command.add('lockon', () => {
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
        bossInfo = null;
        locking = false;
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

    dispatch.hook('C_PLAYER_LOCATION', 1, { order: -10 }, (event) => {
        ownX = (event.x1 + event.x2) / 2;
        ownY = (event.y1 + event.y2) / 2;
        ownZ = (event.z1 + event.z2) / 2;
    });

    dispatch.hook('S_ABNORMALITY_BEGIN', 1, { order: -10 }, (event) => {
        if (event.source.low == 0 || event.source.high == 0 || event.target.equals(event.source) || partyMembers == null || event.source.equals(cid)) return;
        for (let y = x; y < partyMembers.length; y++) {
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

    dispatch.hook('S_BOSS_GAGE_INFO', 2, { order: -10 }, (event) => {

        if (event.curHp < event.maxHp && bossInfo == null) {
            bossInfo = {
                id: event.id,
                x: null,
                y: null,
                z: null,
                w: null,
                hp: Math.round(event.curHp / event.maxHp * 100)
            };
        }

        if (bossInfo != null && event.id.equals(bossInfo.id)) {
            bossInfo.hp = Math.round(event.curHp / event.maxHp * 100);
            if (event.curHp <= 0) bossInfo = null;
        }

    });

    dispatch.hook('S_ACTION_STAGE', 1, { order: -10 }, (event) => {

        if (bossInfo == null) return;
        if (event.source.equals(bossInfo.id)) {
            bossInfo.x = event.x;
            bossInfo.y = event.y;
            bossInfo.z = event.z;
            bossInfo.w = event.w;
        }

    });

    dispatch.hook('C_START_SKILL', 3, { order: -10 }, (event) => {
        //message(event.skill);
        if (!enabled) return;

        let packetSkillInfo2 = skills.find(o => (o.id + 10) == event.skill);
        if (packetSkillInfo2 && packetSkillInfo2.job == job) {
            locking = false;
            if (packetSkillInfo2.type == 'cleanse' && partyMembers != null) {
                for (let i = 0; i < partyMembers.length; i++) {
                    partyMembers[i].debuff = false;
                    partyMembers[i].debId = [];
                }
            }
        }

        let packetSkillInfo = skills.find(o => o.id == event.skill);
        if (packetSkillInfo && packetSkillInfo.job == job && partyMembers != null) {

            if (packetSkillInfo.type == 'heal' && partyMembers.length > 0) {
                sortHp();
                let qtdTarget = 0;
                locking = true;
                for (let i = 0; i < partyMembers.length; i++) {

                    let distance = checkDistance(ownX, ownY, ownZ, partyMembers[i].x, partyMembers[i].y, partyMembers[i].z);

                    if (partyMembers[i].hpP > 0 && partyMembers[i].hpP < 100 && distance <= 35 && qtdTarget <= packetSkillInfo.targets) {
                        let newEvent = {
                            target: partyMembers[i].cid,
                            unk: 0,
                            skill: event.skill
                        }
                        doTimeOutLock(newEvent);
                        qtdTarget++;
                    }

                }

            } else if (packetSkillInfo.type == 'cleanse' && partyMembers != null) {
                let qtdTarget = 0;
                locking = true;
                for (let i = 0; i < partyMembers.length; i++) {
                    let distance = checkDistance(ownX, ownY, ownZ, partyMembers[i].x, partyMembers[i].y, partyMembers[i].z);

                    if (distance <= 35 && qtdTarget <= packetSkillInfo.targets) {
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

            } else if ((packetSkillInfo.type == 'dps' || packetSkillInfo.type == 'buff') && bossInfo != null) {
                let distance = checkDistance(ownX, ownY, ownZ, bossInfo.x, bossInfo.y, bossInfo.z);
                locking = true;

                if (distance <= 35) {
                    let newEvent = {
                        target: bossInfo.id,
                        unk: 0,
                        skill: event.skill
                    }
                    doTimeOutLock(newEvent);
                    if (autoDps) {
                        doSkillActivation(event);
                    }
                }
            } else if ((packetSkillInfo.type == 'debuff' || packetSkillInfo.type == 'debuff2') && bossInfo != null) {
                let distance = checkDistance(ownX, ownY, ownZ, bossInfo.x, bossInfo.y, bossInfo.z);
                locking = true;

                if (distance <= 35) {
                    let newEvent = {
                        target: bossInfo.id,
                        unk: 0,
                        skill: event.skill
                    }
                    doTimeOutLock(newEvent);
                }
            }

        }
    });

    dispatch.hook('C_CANCEL_SKILL', 1, { order: -10 }, (event) => {
        let packetSkillInfo = skills.find(o => o.id == event.skill);
        if (packetSkillInfo && packetSkillInfo.job == job && partyMembers != null) {
            locking = false;
        }
    });

    function doSkillActivation(event) {
        event.skill = (event.skill + 10);
        setTimeout(function () {
            dispatch.toServer('C_START_SKILL', 3, event);
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