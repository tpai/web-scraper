require("dotenv").config();

const isReachable = require("is-reachable");
const puppeteer = require("puppeteer");

const { NODE_ENV, PAGE_URL, PAGE_SELECTOR, CHROME_HOST } = process.env;
const BROWSER_URL = `http://${CHROME_HOST || "0.0.0.0"}:9222`;

const checkAlive = async (url) => {
  const isReached = await isReachable(url);
  if (!isReached) {
    return await checkAlive();
  }
  return true;
};

const app = async () => {
  let browser;
  try {
    console.log("Launch browser");
    if (NODE_ENV === "development") {
      browser = await puppeteer.launch();
    } else {
      console.log("Check browser health...");
      const isAlive = await checkAlive(BROWSER_URL);
      if (!isAlive) {
        console.log("Browser is dead!");
        return;
      }
      browser = await puppeteer.connect({
        browserURL: BROWSER_URL,
      });
    }
    console.log(await browser.version());

    console.log(`Open page: ${PAGE_URL}`);
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(PAGE_URL);

    const result = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      return {
        text: element.textContent,
        // fix relative url
        // e.g. href=":id" => href="{hostname}/:id"
        html: element.outerHTML.replace(
          /href="([^.]*)"/g,
          (_, p1) => `href="${window.location.href}${p1}"`
        ),
      };
    }, PAGE_SELECTOR);
    await page.close();
    return result;
  } catch (err) {
    console.error(err);
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
    const result = await sendEmail(data);
    res.send(result);
  } catch (e) {
    res.sendStatus(400);
  }
});

server.listen(port, () => {
  console.log(`Example app listening at http://0.0.0.0:${port}`);
});
