const fs = require('fs');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app">{{ missingFunction() }}</div></body></html>', { runScripts: "dangerously" });
dom.window.eval(fs.readFileSync('./frontend/vendor/vue.global.prod.js', 'utf8'));
dom.window.eval(`
  window.onerror = function(msg) {
    console.log("CAUGHT GLOBALLY:", msg);
  };
  console.error = function(msg) {
    console.log("CAUGHT BY CONSOLE.ERROR:", msg);
  };
  Vue.createApp({}).mount('#app');
`);
