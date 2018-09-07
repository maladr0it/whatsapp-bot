const puppeteer = require("puppeteer");

module.exports = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./userData"
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36"
  );
  await page.goto("https://web.whatsapp.com");

  return { browser, page };
};
