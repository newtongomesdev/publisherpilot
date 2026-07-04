# SearXNG Integration Documentation

This document explains the SearXNG architecture and configuration used in Atlas Forge AI.

## Architecture

The search service is powered by a stateless SearXNG container integrated into our Docker Compose network. The Next.js API endpoints (`/api/search` and `/api/images/search`) query this container internally.

```
[Browser Client] 
      │ (HTTPS)
      ▼
[Next.js App Server]
      │ (Internal Docker Network)
      ▼
[Custom SearXNG Container] ──(Web Searches)──► [Search Engines (DuckDuckGo, Brave, etc.)]
```

## Configuration Files

The SearXNG configuration files are located under `searxng_config_v2/`:
- `settings.yml`: Custom settings defining instance names, enabling the JSON output format, and configuring default engines and image proxying.
- `limiter.toml`: Excludes internal Docker IP ranges from rate limits and bot detection blocks.

## Deployment Strategy (Important)

We build a custom Docker image for SearXNG rather than mounting host files. This resolves a known issue where VPS hosts create dummy directories or encounter Linux permission errors for mounted config files.

The setup consists of:
1. **Dockerfile.searxng**: Bakes the config files directly into the image.
   ```dockerfile
   FROM searxng/searxng:latest
   COPY ./searxng_config_v2/settings.yml /etc/searxng/settings.yml
   COPY ./searxng_config_v2/limiter.toml /etc/searxng/limiter.toml
   USER root
   RUN chmod 644 /etc/searxng/settings.yml /etc/searxng/limiter.toml
   ```
2. **docker-compose.yaml**:
   ```yaml
   searxng:
     build:
       context: .
       dockerfile: Dockerfile.searxng
     restart: unless-stopped
     environment:
       - SEARXNG_BASE_URL=http://localhost:8080/
       - SEARXNG_LIMITER=false
   ```

## Development & Maintenance

### Changing Settings
If you modify `settings.yml` or `limiter.toml`, you must rebuild the image to apply the changes:
```bash
docker compose up -d --build searxng
```

### Bypassing 403 blocks (Session Client)
SearXNG automatically blocks requests that query `/search?format=json` directly without a valid session.
To solve this, use `searxngFetch` from `lib/searxng-client.ts` in Next.js code. It:
1. Obtains a session cookie from SearXNG's home page first.
2. Caches and attaches it to subsequent search requests.
3. Transparently refreshes the cookie and retries if a `403 Forbidden` response is received.
