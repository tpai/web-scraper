require("dotenv").config();

const dns = require("dns").promises;
const isReachable = require("is-reachable");
const puppeteer = require("puppeteer");

const {
  NODE_ENV,
  PAGE_URL,
  PAGE_SELECTOR,
  CHROME_HOST,
  HEALTH_CHECK_URL,
} = process.env;

const checkAlive = async (url) => {
  const isReached = await isReachable(url);
  if (!isReached) {
    return await checkAlive();
  }
  return true;
};

let page;
const app = async () => {
  let browser;
  try {
    console.log("Launch browser");
    if (NODE_ENV === "development") {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
      });
    } else {
      console.log(`CHROME_HOST=${CHROME_HOST}`);

      const { address } = await dns.lookup(CHROME_HOST || "localhost", {
        family: 4,
        hints: dns.ADDRCONFIG,
      });

      console.log(`IP_ADDRESS=${address}`);
      console.log("Check browser health...");
      const isAlive = await checkAlive(`http://${address}:9222`);
      if (!isAlive) {
        console.log("Browser is dead!");
        return;
      }

      browser = await puppeteer.connect({
        browserURL: `http://${address}:9222`,
      });
    }
    console.log(await browser.version());

    console.log(`Open page: ${PAGE_URL}`);
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36");
    await page.goto(PAGE_URL);

    const result = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      return {
        text: element.textContent,
        // fix relative url
        // e.g. href=":id" => href="{hostname}/:id"
        html: element.outerHTML.replace(
          /href="([^"]*)"/g,
          (_, p1) => `href="${window.location.href}${p1}"`
        ),
      };
    }, PAGE_SELECTOR);
    return result;
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    await page.close();
    console.log('Close page');
  }
};

if (NODE_ENV === "development") {
  (async function () {
    const data = await app();
    console.log(data);
  })();
}

const express = require("express");
const { sendEmail } = require("./utils/email");
const server = express();
const port = 3000;

server.get("/", async (_, res) => {
  try {
    const data = await app();
    console.log("Sending email...");
    const result = await sendEmail(data);
    console.log("Sent");
    if (HEALTH_CHECK_URL) {
      await isReachable(HEALTH_CHECK_URL);
    }
    res.send(result);
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
});

server.listen(port, () => {
  console.log(`Example app listening at http://0.0.0.0:${port}`);
});
