/**
 ** JS Library to ease your work with BG Repeaters JSON DB.
 *
 * @version: 0.5
 * @author: LZ2SLL - https://0xAF.org/about
 * @license: MIT - https://af.mit-license.org/
 *!JSON DB: https://varna.radio/reps.json
 * @summary: check the end of this file for changelog
 *
 *!TODO: autogenerate maidenhead  https://gist.github.com/stephenhouser/4ad8c1878165fc7125cb547431a2bdaa
 *
 *?To include this script in your project:
 * <script src="https://varna.radio/reps.js"></script>
 */

/**
// @example:
// Create instance of repeaters object:
const repeaters = new Repeaters; // use defaults

// or create with options (example with defaults):
const repeaters = new Repeaters({
  noAlerts: false, // Boolean [true|false] - disable browser alerts on error
  warnings: false, // Boolean [true|false] - show warnings in console
  debug: false,    // Boolean [true|false] - show debug in console
  loadData: false, // Boolean [true|false] - load JSON data on creation
});

// async usage (to ensure the data is loaded)
// you can call loadData() many times. it will fetch data only once, then it will use cached data.
// creating repeaters object with loadData option set to true will call loadData() for you.
repeaters.loadData().then((fullJSON) => {
  const repsAll = repeaters.get();
  const repsVarna = repeaters.get('Варна'); // Get all repeaters in "Варна" location.
  const repsNorthEastCoast = repeaters.get(['Варна', 'Каварна', 'Слънчев Бряг']); // same but with more locations
  console.log(fullJSON); // dump raw JSON to console. this raw data will be missing some properties in repeaters
  // ... your code here ...
});

// sync usage (check if data is loaded)
// loadData() must be called either when creating the object (loadData option) or separately.
if (repeaters.loaded) {
  const repsAll = repeaters.get();
}

// get the DB update date
console.log('DB last updated on:' + repeaters.lastUpdate());

// get the Changes Log for DB
console.log(repeaters.changelog());

*/


(function () {
  class Repeaters {
    constructor(opts) {
      this.alerts = opts && opts.noAlerts ? false : true;
      this.warnings = opts && opts.warnings ? true : false;
      this.debug = opts && opts.debug ? true : false;
      this.loaded = false;
      this.jsonData = {};

      this.loadData = this.loadData.bind(this);
      this.get = this.get.bind(this);
      this.lastUpdate = this.lastUpdate.bind(this);
      this.changelog = this.changelog.bind(this);

      if (opts.loadData)
        this.loadData().then(() => {
          this.loaded = true;
        });
    }

    /**
     * Returns Array with repeaters objects for the requested cities (or all)
     * @param {(string|string[])} [locations] - String or Array with cities
     * @returns {Array} - repeaters objects
     */
    get(locations = []) {
      if (!this.loaded) {
        if (this.warnings)
          console.warn("R: Repeaters data not loaded.");
        return [];
      }
      if (typeof locations === 'string') {
        locations = [locations];
      }
      locations = locations.map(l => l.toUpperCase()); // convert wanted cities to UpperCase

      let reps = Object.values(this.jsonData.repeaters)
        .filter(r => locations.length ? locations.includes(r.loc.toUpperCase()) : true) // find wanted repeaters
        .filter(r => r.disabled ? false : true) // remove disabled
        .sort(function (a, b) { // sort by callsign with localeCompare (which ignores case)
          return ('' + a.callsign).localeCompare(b.callsign, 'en', {
            numeric: true,
            sensitivity: 'base'
          });
        })
        .map((r) => ({ // add some properties
          ...r,
          info: Array.isArray(r.info) ? r.info : [], // create if missing
          infoHTML: r.info.join('<br>'),
          infoString: r.info.join("\r\n").replace(/<[^>]+>/gm, ''),
          loc: r.loc || '', // create if missing
          locExtra: r.locExtra || '', // create if missing
          location: r.loc + (r.locExtra ? (" - " + r.locExtra) : ''),
          mode: (r.mode instanceof Object && !(r.mode instanceof Array)) ? r.mode : {}, // create if missing
          modesString: Object.keys(r.mode).sort().join(", "),
          modesArray: Object.keys(r.mode).sort(),
          qth: r.qth || '', // create if missing
          altitude: parseInt(r.altitude) || 0, // create if missing
          channel: this.getChannel(r.rx), // get Channel number (eg: R2, RV63, RU732)
          band: parseFloat(r.rx) > 146 ? 'UHF' : 'VHF',
          rx: this.getFormatedFreq(r.rx), // format freq to 3 or 4 fixed point
          tx: this.getFormatedFreq(r.tx), // format freq to 3 or 4 fixed point
        }));
      return reps;
    }

    /**
     * Load the JSON data from repeaters file.
     * @returns {Promise} - Promise representing RAW JSON data
     */
    loadData() {
      const self = this;
      return new Promise(async function (resolve, reject) {
        if (!Object.keys(self.jsonData).length) {
          if (self.debug)
            console.log('R: Loading data from JSON.');
          const response = await fetch("https://varna.radio/reps.json");
          // const response = await fetch("https://localhost:9200/reps.json");
          if (!response.ok || response.status > 299 || response.status < 200) {
            const message = `An error has occured: ${response.status}. Cannot load repeaters JSON.`;
            if (this.alerts) alert(`ERROR: ${message}`);
            if (this.warnings) console.warn(`R: ERROR: ${message}`);
            reject(Error(message));
          }
          self.jsonData = await response.json();
          // console.log(self.jsonData);
          // self.jsonData.repeaters = self.jsonData.repeaters.filter(r => r.disabled ? undefined : r);
        }
        self.loaded = true;
        resolve(self.jsonData);
      });
    }

    /**
     * Get the last change date of JSON file.
     * @returns {string} - YYYY-MM-DD string with date of last change in JSON file
     */
    lastUpdate() {
      if (!this.loaded) {
        if (this.warnings)
          console.warn("R: Repeaters data is not loaded.");
        return '';
      }
      const last = Object.keys(this.jsonData.changelog)[0];
      return last;
    }

    /**
     * Get information for changes in JSON file.
     * @returns {Object} - Object with changes in JSON file
     */
    changelog() {
      if (!this.loaded) {
        if (this.warnings)
          console.warn("R: Repeaters data is not loaded.");
        return '';
      }
      return this.jsonData.changelog;
    }

    // ------------------------------ Utility methods ------------------------------

    getChannel(rx) {
      /* NOTE: calculations are based on repeater output freq
      IARU-R1
      Channel designation system for VHF/UHF FM channels
      https://www.iaru-r1.org/wp-content/uploads/2021/03/VHF_Handbook_V9.01.pdf
      section: 2.4.1 Principle
      The system is based upon the following principles:
      • For each band, there should be a "designator letter":
        1. 51 MHz : F
        2. 145 MHz : V
        3. 435 MHz : U
      • Each designator letter should be followed by two (for 50 and 145 MHz) or three (for 435 MHz) digits which indicate the channel.
      • If a channel is used as a repeater output, its designator should be preceded by the letter "R".
      • In the 50 MHz band the channel numbers start at F00 for 51.000 MHz and increment by one for each 10 kHz.
      • In the 145 MHz band the channel numbers start at V00 for 145.000 MHz and increment by one for each 12.5 kHz.
      • In the 435 MHz band the channel numbers start at U000 for 430 MHz and increment by one for each 12.5 kHz.
      */

      // NOTE: in JS the % operator is 'reminder', not 'modulo'.
      // it's not working correctly with numbers < 1
      // Try in your browser console
      // 0.5 % 0.05
      // 0.1 % 0.01
      // so I had to get the freq to integer
      const f = parseFloat(rx).toFixed(4) * 10000;
      let chan = "N/A";
      if (f >= 1452000 && f < 1454000 && (f - 1452000) % 250 == 0) { // VHF R8-R15
        chan = 'R' + parseInt(((f - 1452000) / 250) + 8);
      } else if (f >= 1456000 && f < 1460000 && (f - 1456000) % 250 == 0) { // VHF R0-R7
        chan = 'R' + parseInt((f - 1456000) / 250);
      } else if (f >= 4300000 && f < 4400000 && (f - 4300000) % 125 == 0) { // UHF
        chan = 'RU' + ((f - 4300000) / 125).toFixed(0).padStart(3, '0');
      }
      if (f >= 1450000 && f < 1460000 && (f - 1450000) % 125 == 0) // VHF RV channels
        chan = (chan === 'N/A' ? '' : chan + ', ') + 'RV' + ((f - 1450000) / 125).toFixed(0).padStart(2, '0');

      if (chan === 'N/A' && this.warnings)
        console.warn(`R: Unknown Channel for frequency ${rx.toFixed(4)}`);
      return chan;
    }

    getFormatedFreq(f) {
      let fstr = parseFloat(f).toFixed(4).toString();
      // the next line can be replaced by parseFloat(), which should remove the extra zeroes in the end, tho we need 3 digits after the decimal point probably... may be we can use padEnd() somehow.
      let r = fstr.charAt(fstr.length - 1) === '0' ? parseFloat(f).toFixed(3) : parseFloat(f).toFixed(4);
      return r;
    }

  }

  window.Repeaters = Repeaters; // export the class to global space

})()

/**
 *! ChangeLog:
 ** v0.5 (2023-06-14) - added "disabled" property to repeater object
 ** v0.4 (2022-12-15) - first public release
 */
