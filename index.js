const initialize = require("./initialize.js");
const processMessages = require("./processMessages");
const run = require("./run.js");

(async () => {
  const { browser, page } = await initialize();
  run(page, processMessages);
})();
