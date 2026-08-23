const fs = require('fs');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"><input @keyup.enter="missingFunction"></div></body></html>', { runScripts: "dangerously" });
dom.window.eval(fs.readFileSync('./frontend/vendor/vue.global.prod.js', 'utf8'));
dom.window.eval(`
  Vue.createApp({
    setup() {
      console.log("Setup called");
      Vue.onMounted(() => {
        console.log("ONMOUNTED FIRED!");
      });
      return {};
    }
  }).mount('#app');
`);
