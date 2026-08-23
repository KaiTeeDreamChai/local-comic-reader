const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync("./frontend/index.html", "utf8");
const dom = new JSDOM(html, { runScripts: "dangerously" });

// Mock API and setup
dom.window.fetch = async (url) => {
  return {
    ok: true,
    json: async () => {
      if (url.includes('/api/info')) return { version: "1.0.0" };
      if (url.includes('/api/filesystem/drives')) return { drives: [] };
      return { is_root: true, bookshelves: [] };
    }
  };
};

dom.window.onerror = function(msg, source, lineno, colno, error) {
  console.log("JSDOM ONERROR:", msg);
};

dom.window.console.warn = function() {
  console.log("JSDOM WARN:", ...arguments);
};

dom.window.console.error = function() {
  console.log("JSDOM ERROR:", ...arguments);
};

const vueCode = fs.readFileSync("./frontend/vendor/vue.global.prod.js", "utf8");
dom.window.eval(vueCode);

dom.window.eval(fs.readFileSync("./frontend/js/i18n.js", "utf8"));
dom.window.eval(fs.readFileSync("./frontend/js/touch.js", "utf8"));
dom.window.eval(fs.readFileSync("./frontend/js/modules/api.js", "utf8"));
dom.window.eval(fs.readFileSync("./frontend/js/modules/novelReader.js", "utf8"));
dom.window.eval(fs.readFileSync("./frontend/js/modules/comicReader.js", "utf8"));
dom.window.eval(fs.readFileSync("./frontend/js/app.js", "utf8"));

setTimeout(() => {
  const app = dom.window.document.querySelector("#app");
  if (app) {
    console.log("Has v-cloak?", app.hasAttribute("v-cloak"));
    console.log("App HTML Length:", app.innerHTML.length);
  } else {
    console.log("#app not found!");
  }
}, 1000);
