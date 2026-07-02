# Use the official Puppeteer image which already includes Chromium and its dependencies
FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

# The puppeteer image runs as 'pptruser' by default.
# We copy files with ownership to avoid permission issues.
COPY --chown=pptruser:pptruser package*.json ./
RUN npm install --omit=dev

COPY --chown=pptruser:pptruser . .

# We don't need to set PUPPETEER_EXECUTABLE_PATH because the base image handles it.
EXPOSE 3003

CMD ["node", "server.js"]
