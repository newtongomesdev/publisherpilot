# Coolify Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `Coolify` deployment boot reliably with `Docker Compose`, internal service defaults, persistent SQLite storage, and consistent `SearXNG` runtime configuration.

**Architecture:** Keep the existing multi-service stack centered on `docker-compose.yaml`, inject the app's internal runtime URLs directly in the `app` service, and persist SQLite via a named volume. Normalize the only known divergent `SearXNG` fallback in code so runtime behavior matches the compose and docs.

**Tech Stack:** `Docker Compose`, `Next.js 15`, `TypeScript`, `Vitest`, `Coolify`, `SQLite`, `ChromaDB`, `SearXNG`, `Puppeteer renderer`

---

### Task 1: Add Coolify-ready runtime defaults to the compose stack

**Files:**
- Modify: `docker-compose.yaml`

- [ ] **Step 1: Edit the `app` service to include internal runtime envs and persistent SQLite storage**

Replace the current `app` service block in `docker-compose.yaml` with:

```yaml
services:
  # App principal (Next.js)
  app:
    build: .
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/data/data.db
      - CHROMADB_URL=http://chromadb:8000
      - RENDERER_URL=http://renderer:3003
      - SEARXNG_URL=http://searxng:8080
    volumes:
      - app-data:/app/data
    depends_on:
      - searxng
      - chromadb
      - renderer

  # SearXNG - Metasearch para busca de imagens
  searxng:
    image: searxng/searxng:latest
    restart: unless-stopped
    environment:
      - SEARXNG_BASE_URL=http://localhost:8080/

  # ChromaDB - Banco vetorial para busca semântica
  chromadb:
    image: chromadb/chroma:latest
    restart: unless-stopped
    volumes:
      - chroma-data:/chroma/chroma
    environment:
      - ANONYMIZED_TELEMETRY=False
      - IS_PERSISTENT=True
      - PERSIST_DIRECTORY=/chroma/chroma

  # Renderer - Puppeteer para renderizar slides em PNG
  renderer:
    build: ./scripts/renderer
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3003

volumes:
  app-data:
  chroma-data:
```

- [ ] **Step 2: Validate the compose syntax before touching anything else**

Run:

```bash
docker compose -f docker-compose.yaml config
```

Expected: rendered config output containing:

```text
DATABASE_URL: file:/app/data/data.db
CHROMADB_URL: http://chromadb:8000
RENDERER_URL: http://renderer:3003
SEARXNG_URL: http://searxng:8080
```

- [ ] **Step 3: Commit the compose-only change**

```bash
git add docker-compose.yaml
git commit -m "fix: add coolify runtime defaults to compose"
```

---

### Task 2: Normalize the `SearXNG` fallback with a focused test

**Files:**
- Create: `tests/api/images-search-config.test.ts`
- Modify: `app/api/images/search/route.ts`

- [ ] **Step 1: Write the failing test for the image search route fallback**

Create `tests/api/images-search-config.test.ts` with:

```ts
import { afterEach, describe, expect, it } from "vitest";

afterEach(() => {
  delete process.env.SEARXNG_URL;
});

describe("images search searxng fallback", () => {
  it("uses port 8080 when SEARXNG_URL is not defined", async () => {
    delete process.env.SEARXNG_URL;

    const { GET } = await import("@/app/api/images/search/route");
    const request = new Request("http://localhost:3000/api/images/search?q=atlas");

    const originalFetch = global.fetch;
    let requestedUrl = "";

    global.fetch = (async (input: RequestInfo | URL) => {
      requestedUrl = String(input);
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    try {
      await GET(request);
    } finally {
      global.fetch = originalFetch;
    }

    expect(requestedUrl).toContain("http://localhost:8080/search");
  });
});
```

- [ ] **Step 2: Run the new test and confirm the current fallback fails**

Run:

```bash
npm run test -- tests/api/images-search-config.test.ts
```

Expected: FAIL because the route still uses `http://localhost:8888`.

- [ ] **Step 3: Update the route fallback to match the documented default**

Change `app/api/images/search/route.ts` to:

```ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  if (!query) {
    return NextResponse.json({ ok: false, error: "Missing query" }, { status: 400 });
  }

  const searxngUrl = process.env.SEARXNG_URL || "http://localhost:8080";
  const limit = Math.min(parseInt(searchParams.get("limit") || "15", 10), 20);

  try {
    const url = `${searxngUrl}/search?q=${encodeURIComponent(query)}&categories=images&format=json&image_proxy=0&safesearch=0&pageno=1`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "AtlasForge/1.0 (article image search)" },
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      return NextResponse.json({ ok: false, error: `SearXNG returned ${resp.status}` }, { status: 502 });
    }

    const data = (await resp.json()) as { results?: Array<{
      img_src?: string;
      thumbnail?: string;
      title?: string;
      source?: string;
      url?: string;
    }> };

    const results = (data.results ?? [])
      .filter((r) => r.img_src)
      .slice(0, limit)
      .map((r) => {
        const imgSrc = r.img_src ?? "";
        const proxy = (u: string) => u ? `/api/images/proxy?url=${encodeURIComponent(u)}` : "";
        return {
          src: proxy(imgSrc),
          thumbnail: proxy(imgSrc),
          title: r.title ?? "",
          source: r.source ?? "",
          pageUrl: r.url ?? "",
        };
      });

    return NextResponse.json({ ok: true, results });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to reach SearXNG" }, { status: 502 });
  }
}
```

- [ ] **Step 4: Re-run the focused test and verify it passes**

Run:

```bash
npm run test -- tests/api/images-search-config.test.ts
```

Expected: PASS with 1 passing test.

- [ ] **Step 5: Commit the fallback fix**

```bash
git add app/api/images/search/route.ts tests/api/images-search-config.test.ts
git commit -m "fix: align searxng fallback with deploy defaults"
```

---

### Task 3: Align environment documentation with the actual Coolify stack

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Update `.env.example` so local and Coolify values are documented consistently**

Replace the deployment-related block in `.env.example` with:

```env
DATABASE_URL=file:./data.db
TURSO_AUTH_TOKEN=
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_APP_NAME=PublisherPilot
OPENROUTER_SITE_URL=http://localhost:3000
OPENVERSE_CLIENT_ID=
OPENVERSE_CLIENT_SECRET=

# Required secret for production sessions
AUTH_SECRET=

# Docker local: http://localhost:8080 | Coolify internal: http://searxng:8080
SEARXNG_URL=http://localhost:8080
SEARXNG_API_KEY=

PIXABAY_API_KEY=
WORDPRESS_URL=
WORDPRESS_USER=
WORDPRESS_APP_PASSWORD=
DEEPGRAM_API_KEY=

# Docker local: http://localhost:3003 | Coolify internal: http://renderer:3003
RENDERER_URL=http://localhost:3003

FAL_KEY=

# Docker local: http://localhost:8100 | Coolify internal: http://chromadb:8000
CHROMADB_URL=http://localhost:8100
```

- [ ] **Step 2: Update the README deploy section to describe the Coolify compose model**

Replace the current `## Deploy` section in `README.md` with:

```md
## Deploy

### Coolify + VPS

Use `docker-compose.yaml` as the source of truth in `Coolify`.

The compose stack includes:

- `app` - Next.js application
- `chromadb` - semantic search database
- `renderer` - Puppeteer rendering service
- `searxng` - metasearch service

Internal service URLs are already defined in the compose file for `Coolify`:

- `DATABASE_URL=file:/app/data/data.db`
- `CHROMADB_URL=http://chromadb:8000`
- `RENDERER_URL=http://renderer:3003`
- `SEARXNG_URL=http://searxng:8080`

In the `Coolify` panel, configure only external secrets and provider credentials such as:

- `AUTH_SECRET`
- `OPENROUTER_API_KEY`
- `OPENAI_API_KEY`
- `DEEPGRAM_API_KEY`
- `FAL_KEY`
- optional publishing credentials

### Local Docker support

```bash
docker compose up -d
docker compose ps
docker compose down
```
```

- [ ] **Step 3: Verify no stale `8888` fallback remains anywhere in the repo**

Run:

```bash
rg "localhost:8888|8888" app lib tests README.md .env.example docker-compose.yaml
```

Expected: no matches.

- [ ] **Step 4: Commit the docs and env alignment**

```bash
git add .env.example README.md
git commit -m "docs: align env docs with coolify deploy"
```

---

### Task 4: Final validation and editor diagnostics

**Files:**
- Modify: `docker-compose.yaml`
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `app/api/images/search/route.ts`
- Create: `tests/api/images-search-config.test.ts`

- [ ] **Step 1: Run the exact validation commands for the final state**

Run:

```bash
docker compose -f docker-compose.yaml config
npm run test -- tests/api/images-search-config.test.ts
```

Expected:

```text
docker compose ... config
name: atlasforgeai
services:
  app:
    environment:
      DATABASE_URL: file:/app/data/data.db
      CHROMADB_URL: http://chromadb:8000
      RENDERER_URL: http://renderer:3003
      SEARXNG_URL: http://searxng:8080
```

and:

```text
✓ tests/api/images-search-config.test.ts (1 test)
```

- [ ] **Step 2: Check editor diagnostics on the changed files**

Inspect diagnostics for:

```text
e:\Vibecode apps\Atlas Forge AI\docker-compose.yaml
e:\Vibecode apps\Atlas Forge AI\.env.example
e:\Vibecode apps\Atlas Forge AI\README.md
e:\Vibecode apps\Atlas Forge AI\app\api\images\search\route.ts
e:\Vibecode apps\Atlas Forge AI\tests\api\images-search-config.test.ts
```

Expected: no new errors introduced by this work.

- [ ] **Step 3: Create the final integration commit**

```bash
git add docker-compose.yaml .env.example README.md app/api/images/search/route.ts tests/api/images-search-config.test.ts
git commit -m "fix: prepare coolify docker compose deployment"
```

- [ ] **Step 4: Push for Coolify to redeploy**

```bash
git push origin main
```

Expected: push succeeds and `Coolify` can redeploy from the updated `main` branch.
