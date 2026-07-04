# Project Rules & Customizations

This file contains workspace-specific rules and system configurations for AI agents working on Atlas Forge AI.

## SearXNG Configuration (Search & Images)

SearXNG is used as the search backend for text and images. To avoid common deployment and caching issues on VPS/Docker environments, we use a custom Dockerfile setup:

1. **No Host Volume Mounts**: Do NOT map host configuration files to `/etc/searxng` via compose volumes (e.g. `./searxng_config:/etc/searxng` or `./searxng_config/settings.yml:/etc/searxng/settings.yml`). Doing so causes `IsADirectoryError` loops on VPS platforms because Docker creates directories when host files do not exist during initial mount, and permissions/caching issues persist.
2. **Dockerfile.searxng**: We build a custom image from `Dockerfile.searxng` which copies `settings.yml` and `limiter.toml` directly into the image at `/etc/searxng/`.
3. **Settings Customization**:
   - `search.formats`: MUST include `json` for the API client to work (`NextResponse.json()` fails with 403 Forbidden if JSON format is disabled in SearXNG defaults).
   - `server.limiter`: Disabled (`false`) to prevent bot detection blockades inside Docker.
4. **Session-Aware Client**: The app interacts with SearXNG using `searxngFetch` (from `lib/searxng-client.ts`), which automatically manages session cookies and handles retries to bypass 403 blocks. Do NOT use plain `fetch` to query SearXNG.
5. **Rebuilding SearXNG**: When changing SearXNG settings in `searxng_config_v2/settings.yml` or `limiter.toml`, the container image must be rebuilt (`docker compose up -d --build`) rather than just restarted.
