import puppeteer from "puppeteer-core";

const RENDERER_URL = process.env.RENDERER_URL || "";
const CHROME_PATH =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const WIDTH = 1080;
const HEIGHT = 1350;
const SCALE = 2;

let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

async function getBrowser() {
  if (browser && browser.connected) return browser;

  browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  return browser;
}

async function renderWithLocalPuppeteer(
  html: string,
  width = WIDTH,
  height = HEIGHT
): Promise<{ ok: boolean; png: string; width: number; height: number }> {
  const b = await getBrowser();
  const page = await b.newPage();

  await page.setViewport({
    width,
    height,
    deviceScaleFactor: SCALE,
  });

  await page.setContent(html, { waitUntil: "load", timeout: 30000 });

  const screenshot = await page.screenshot({
    type: "png",
    clip: { x: 0, y: 0, width, height },
  });

  await page.close();

  return {
    ok: true,
    png: Buffer.from(screenshot).toString("base64"),
    width: width * SCALE,
    height: height * SCALE,
  };
}

async function renderWithExternalService(
  html: string,
  width = WIDTH,
  height = HEIGHT
): Promise<{ ok: boolean; png: string; width: number; height: number }> {
  const resp = await fetch(`${RENDERER_URL}/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html, width, height }),
    signal: AbortSignal.timeout(60000),
  });

  return resp.json();
}

async function renderBatchWithExternalService(
  slides: { html: string }[],
  width = WIDTH,
  height = HEIGHT
): Promise<{ ok: boolean; slides: string[]; width: number; height: number }> {
  const resp = await fetch(`${RENDERER_URL}/render-batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slides, width, height }),
    signal: AbortSignal.timeout(120000),
  });

  return resp.json();
}

export async function renderSlide(
  html: string,
  width = WIDTH,
  height = HEIGHT
) {
  if (RENDERER_URL) {
    try {
      return await renderWithExternalService(html, width, height);
    } catch {
      // Fall through to local Puppeteer
    }
  }

  return renderWithLocalPuppeteer(html, width, height);
}

export async function renderSlideBatch(
  slides: { html: string }[],
  width = WIDTH,
  height = HEIGHT
) {
  if (RENDERER_URL) {
    try {
      return await renderBatchWithExternalService(slides, width, height);
    } catch {
      // Fall through to local Puppeteer
    }
  }

  const results: string[] = [];
  for (const slide of slides) {
    const result = await renderWithLocalPuppeteer(slide.html, width, height);
    results.push(result.png);
  }

  return {
    ok: true,
    slides: results,
    width: width * SCALE,
    height: height * SCALE,
  };
}

export async function checkRendererHealth() {
  if (RENDERER_URL) {
    try {
      const resp = await fetch(`${RENDERER_URL}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      const data = await resp.json();
      if (data.ok) return { ok: true, mode: "docker" as const };
    } catch {}
  }

  try {
    const fs = await import("fs");
    if (fs.existsSync(CHROME_PATH)) {
      return { ok: true, mode: "local-chrome" as const };
    }
  } catch {}

  return { ok: false, mode: "none" as const };
}
