module.exports = [
    // mystic basic heal 
    {
        id: 67159764,
        job: 7,
        type: 'heal',
        dist: 35,
        targets: 4
    },
    // priest basic heal
    {
        id: 67299764,
        job: 6,
        type: 'heal',
        dist: 35,
        targets: 4
    },
    // Healing immersion
    {
        id: 67479064,
        job: 6,
        type: 'heal',
        dist: 35,
        targets: 1
    },

    // mystic cleanse
    {
        id: 67198964,
        job: 7,
        type: 'cleanse',
        dist: 35,
        targets: 4
    },

    // Volley of Curses
    {
        id: 67349864,
        job: 7,
        abnormality: [27160, 28090],
        dist: 30,
        type: 'debuff'
    },
    
    // Sleep Mystic
    {
        id: 67389064,
        job: 7,
        abnormality: [],
        dist: 30,
        type: 'debuff2'
    },
    // Plague
    {
        id: 67409664,
        job: 6,
        abnormality: [],
        dist: 30,
        type: 'debuff2'
    },

    // E-Star
    {
        id: 67459264,
        job: 6,
        abnormality: [801500, 801501, 801502, 801503],
        dist: 25,
        type: 'buff'
    },

    // Contagion
    {
        id: 67518964,
        job: 7,
        abnormality: [],
        dist: 30,
        type: 'dps'
    },
    // Arrow Volley
    {
        id: 67129964,
        job: 5,
        dist: 35,
        type: 'dps'
    },
    // Flaming Barrage
    {
        id: 67309364,
        job: 4,
        dist: 35,
        type: 'dps'
    },
]
