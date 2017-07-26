module.exports = [
    // mystic basic heal 
    {
        id: 67159764,
        job: 7,
        type: 'heal',
        targets: 4
    },
    // priest basic heal
    {
        id: 67299764,
        job: 6,
        type: 'heal',
        targets: 4
    },
    // Healing immersion
    {
        id: 67479064,
        job: 6,
        type: 'heal',
        targets: 1
    },

    // mystic cleanse
    {
        id: 67198964,
        job: 7,
        type: 'cleanse',
        targets: 4
    },

    // Volley of Curses
    {
        id: 67349864,
        job: 7,
        abnormality: [27160, 28090],
        type: 'debuff'
    },
    
    // Sleep Mystic
    {
        id: 67389064,
        job: 7,
        abnormality: [],
        type: 'debuff2'
    },
    // Plague
    {
        id: 67409664,
        job: 6,
        abnormality: [],
        type: 'debuff2'
    },

    // E-Star
    {
        id: 67459264,
        job: 6,
        abnormality: [801500, 801501, 801502, 801503],
        type: 'buff'
    },

    // Contagion
    {
        id: 67518964,
        job: 7,
        abnormality: [],
        type: 'dps'
    },
    // Arrow Volley
    {
        id: 67129964,
        job: 5,
        type: 'dps'
    },
    // Flaming Barrage
    {
        id: 67309364,
        job: 4,
        type: 'dps'
    },
]
