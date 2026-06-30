const RENDERER_URL = process.env.RENDERER_URL || "";
const WIDTH = 1080;
const HEIGHT = 1350;
const SCALE = 2;

async function renderWithExternalService(
  html: string,
  width = WIDTH,
  height = HEIGHT
): Promise<{ ok: boolean; png: string; width: number; height: number }> {
  if (!RENDERER_URL) {
    throw new Error("RENDERER_URL not configured");
  }
  const resp = await fetch(`${RENDERER_URL}/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html, width, height }),
    signal: AbortSignal.timeout(60000),
  });

  if (!resp.ok) {
    throw new Error(`External renderer returned status ${resp.status}`);
  }

  return resp.json();
}

async function renderBatchWithExternalService(
  slides: { html: string }[],
  width = WIDTH,
  height = HEIGHT
): Promise<{ ok: boolean; slides: string[]; width: number; height: number }> {
  if (!RENDERER_URL) {
    throw new Error("RENDERER_URL not configured");
  }
  const resp = await fetch(`${RENDERER_URL}/render-batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slides, width, height }),
    signal: AbortSignal.timeout(120000),
  });

  if (!resp.ok) {
    throw new Error(`External renderer returned status ${resp.status}`);
  }

  return resp.json();
}

export async function renderSlide(
  html: string,
  width = WIDTH,
  height = HEIGHT
) {
  return renderWithExternalService(html, width, height);
}

export async function renderSlideBatch(
  slides: { html: string }[],
  width = WIDTH,
  height = HEIGHT
) {
  return renderBatchWithExternalService(slides, width, height);
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

  return { ok: false, mode: "none" as const };
}
