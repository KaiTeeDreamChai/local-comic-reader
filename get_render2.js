const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync("./frontend/index.html", "utf8");
const dom = new JSDOM(html, { runScripts: "dangerously" });

const vueCode = fs.readFileSync("./frontend/vendor/vue.global.prod.js", "utf8");
dom.window.eval(vueCode);
dom.window.eval(`
  const appHtmlMatch = document.body.innerHTML.match(/<div id="app"[^>]*>([\\s\\S]*?)<\\/div>\\s*<!-- ========================================== -->/);
  const appHtml = appHtmlMatch ? appHtmlMatch[0] : document.querySelector('#app').outerHTML;
  try {
    const renderFn = Vue.compile(appHtml);
    require('fs').writeFileSync('render_function_dump.js', renderFn.toString());
    console.log("Render function dumped to render_function_dump.js");
  } catch(e) {
    console.error("Compile error:", e);
  }
`);
