# let-me-target

Version: 0.2.0

Auto-lockon module for Tera Proxy.
Still need a lot of tests.
If you found bugs just let me know.

**You need _Command_ module by Pinkie to work.**

## Done
 * Auto-lock members from the lowest to highest HP
    * Priest and Mystic basic heal
    * Healing Immersion
 * Auto-lock up to 4 members to cleanse using smart detection
    * Mystic cleanse
    * Still need tests
    * Can toogle on/off by command and config file (default: on)
 * Auto-lock boss and finish the skill automatically
    * Arrow Voley and Arcane Barrage
    * Energy Start (will be moved **soon** to another type)
    * Auto-finish can be toogle by command and config file (default: off)
    * Delay to finish can be changed by command and config file (default: 300)
 * Toggle module on/off by command
 * Human Behavior for every lockon skill
    * File (config.json)
    * Can toogle on/off by command and config file (default: on)
 * Check up to 35m if can target or not
 * Can add or remove skills in "skills.js" file

 ## Commands
 **Need to be used in _Proxy Channel_ (/proxy)**
```
/proxy lockon (Toogle the module on/off)
/proxy lockhuman (Toogle human behavior on/off)
/proxy smartc (Toogle smart cleanse on/off)
/proxy autodps (Toogle auto finish skill on/off)
/proxy autodps <num> (Change the delay before finish the skill)
```

 ## Planned
 * Better smart detection for Mystic cleanse
 * Save configs chaged by command
 * Improve buff/debuff lockons
 * Others
