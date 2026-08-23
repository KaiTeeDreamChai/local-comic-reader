const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync("./frontend/index.html", "utf8");
const dom = new JSDOM(html, { runScripts: "dangerously", url: "http://localhost/" });

const vueCode = fs.readFileSync("./frontend/vendor/vue.global.prod.js", "utf8");
dom.window.eval(vueCode);
dom.window.eval(fs.readFileSync("./frontend/js/i18n.js", "utf8"));
dom.window.eval(fs.readFileSync("./frontend/js/touch.js", "utf8"));
dom.window.eval(fs.readFileSync("./frontend/js/modules/api.js", "utf8"));
dom.window.eval(fs.readFileSync("./frontend/js/modules/novelReader.js", "utf8"));
dom.window.eval(fs.readFileSync("./frontend/js/modules/comicReader.js", "utf8"));

dom.window.eval(`
  const origCreateApp = Vue.createApp;
  Vue.createApp = function(options) {
    const origSetup = options.setup;
    options.setup = function(...args) {
      try {
        const res = origSetup(...args);
        console.log("SETUP RETURNED KEYS:", Object.keys(res).length);
        console.log("Is t a function?", typeof res.t);
        return res;
      } catch(e) {
        console.error("SETUP CRASHED:", e);
      }
    };
    return origCreateApp(options);
  };
`);

dom.window.eval(fs.readFileSync("./frontend/js/app.js", "utf8"));
