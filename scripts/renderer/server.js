const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3003;
const WIDTH = 1080;
const HEIGHT = 1350;
const SCALE = 2;

let browser = null;

async function getBrowser() {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
  }
  return browser;
}

app.get("/health", (req, res) => {
  res.json({ ok: true, status: "running" });
});

app.post("/render", async (req, res) => {
  try {
    const { html, width = WIDTH, height = HEIGHT } = req.body;

    if (!html) {
      return res.status(400).json({ ok: false, error: "html is required" });
    }

    const b = await getBrowser();
    const page = await b.newPage();

    await page.setViewport({
      width: width,
      height: height,
      deviceScaleFactor: SCALE,
    });

    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    const screenshot = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width, height },
    });

    await page.close();

    res.json({
      ok: true,
      png: screenshot.toString("base64"),
      width: width * SCALE,
      height: height * SCALE,
    });
  } catch (err) {
    console.error("[renderer] Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/render-batch", async (req, res) => {
  try {
    const { slides, width = WIDTH, height = HEIGHT } = req.body;

    if (!slides || !Array.isArray(slides)) {
      return res.status(400).json({ ok: false, error: "slides array is required" });
    }

    const b = await getBrowser();
    const results = [];

    for (const slide of slides) {
      const page = await b.newPage();
      await page.setViewport({
        width: width,
        height: height,
        deviceScaleFactor: SCALE,
      });
      await page.setContent(slide.html, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });
      const screenshot = await page.screenshot({
        type: "png",
        clip: { x: 0, y: 0, width, height },
      });
      await page.close();
      results.push(screenshot.toString("base64"));
    }

    res.json({
      ok: true,
      slides: results,
      width: width * SCALE,
      height: height * SCALE,
    });
  } catch (err) {
    console.error("[renderer-batch] Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

process.on("SIGTERM", async () => {
  if (browser) await browser.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`[renderer] Listening on port ${PORT}`);
});
