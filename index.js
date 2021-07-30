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
    page.setDefaultNavigationTimeout(0); 
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36");
    await page.goto(PAGE_URL);

    const result = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      return {
        text: element.textContent,
        // fix link
        html: element.outerHTML.replace(
          /href="([^"]*)"/g,
          (_, p) => {
            // href="absolute_path" => href="absolute_path"
            if (/http/ig.test(p)) {
              return `href="${p}"`;
            }
            // href="relative_path"
            // case 1: https://{host}/{path1}/{path2}/ => https://{host}/{path1}/{path2}/{p}
            // case 2: https://{host}/{path1}/{path2} => https://{host}/{path1}/{p}
            const endWithSlash = /\/$/.test(p);
            const url = endWithSlash ? `${window.location.href}${p}` : `${window.location.href}/../${p}`;
            return `href="${url}"`;
          }
        ),
      };
    }, PAGE_SELECTOR);
    return result;
  } catch (err) {
    throw new Error(err);
  } finally {
    await page.close();
    console.log('Close page');
  }
};

if (NODE_ENV === "development") {
  (async function () {
    try {
      const data = await app();
      console.log(data);
    } catch(err) {
      console.log(err);
    }
  })();
}

const express = require("express");
const { sendEmail } = require("./utils/email");
const server = express();
const port = 3000;

server.get("/", async (_, res) => {
  try {
    const data = await app();
    if (!data.text || !data.html) {
      throw new Error(data);
    }
    console.log("Sending email...");
    const result = await sendEmail(data);
    console.log("Sent");
    if (HEALTH_CHECK_URL) {
      await isReachable(HEALTH_CHECK_URL);
    }
    res.status(200).send(JSON.stringify(result));
  } catch (err) {
    console.log(err);
    res.status(400).send(`${err}`);
  }
});

server.listen(port, () => {
  console.log(`Example app listening at http://0.0.0.0:${port}`);
});
