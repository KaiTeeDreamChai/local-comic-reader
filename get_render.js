const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync("./frontend/index.html", "utf8");
const dom = new JSDOM(html, { runScripts: "dangerously" });

dom.window.fetch = async () => ({
  ok: true,
  json: async () => ({ is_root: true, bookshelves: [] })
});

const vueCode = fs.readFileSync("./frontend/vendor/vue.global.prod.js", "utf8");
dom.window.eval(vueCode);
dom.window.eval(`
  const origCreateApp = Vue.createApp;
  Vue.createApp = function(options) {
    const origSetup = options.setup;
    options.setup = function(...args) {
      const res = origSetup(...args);
      console.log("Type of t in setup return:", typeof res.t);
      return res;
    };
    return origCreateApp(options);
  };
`);

dom.window.eval(fs.readFileSync("./frontend/js/i18n.js", "utf8"));
dom.window.eval(fs.readFileSync("./frontend/js/touch.js", "utf8"));
dom.window.eval(fs.readFileSync("./frontend/js/modules/api.js", "utf8"));
dom.window.eval(fs.readFileSync("./frontend/js/modules/novelReader.js", "utf8"));
dom.window.eval(fs.readFileSync("./frontend/js/modules/comicReader.js", "utf8"));
dom.window.eval(fs.readFileSync("./frontend/js/app.js", "utf8"));
