# let-me-target

Version: 0.2.9

Auto-lockon module for Tera Proxy.

Still need a lot of tests. If you find any bug just let me know.

**Need _Command_ module by Pinkie to work.**

## Done
 * Auto-lock members from the lowest to highest HP
    * Priest and Mystic basic heal
    * Healing Immersion
 * Auto-lock up to 4 members to cleanse using smart detection
    * Mystic cleanse
    * Can Toggle on/off by command and config file (default: on)
 * Auto-lock boss and finish the skill automatically
    * Arrow Volley and Flaming Barrage (DPS)
    * Energy Stars / Plague / Ishara's Lullaby (Priest)
    * Volley of Curses / Sonorous Dreams / Contagion (Mystic)
    * Auto-finish can be Toggle on/off by command and config file (default: on)
    * Delay to finish can be changed by command and config file (default: 300)
 * Toggle module on/off by command
 * Human Behavior for every lockon skill
    * Can Toggle on/off by command and config file (default: on)
    * Can change min and max time delay in config file (min: 50 / max: 100)
 * Can configure maximum distance for each skill in 'skills.js' file (recommended: 30~35)
 * Can add or remove skills in "skills.js" file
 * Config file: "config.json"

 ## Commands
 **Need to be used in _Proxy Channel_ (/proxy)**
```
/proxy letmelock (Toggle the module on/off)
/proxy lockhuman (Toggle human behavior on/off)
/proxy smartc (Toggle smart cleanse on/off)
/proxy autodps (Toggle auto finish skill on/off)
/proxy autodps <num> (Change the delay before finish the skill)
```

 ## Last Update Fixes
 * Fixed Auto Skills if in group
 * Changed how the module handle skills
 * Added Ishara's Lullaby

 ## Planned
 * Configurable delay for every skill
 * Save configs chaged by command
 * Others
