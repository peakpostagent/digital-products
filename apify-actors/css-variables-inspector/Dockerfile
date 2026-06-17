# CSS Variables Inspector — Playwright-based Apify Actor
# The official apify/actor-node-playwright-chrome image already has Chromium installed
# and on PATH, so we just need to install the JS deps. Skipping `playwright install`
# avoids the EACCES on /pw-browsers when running as the unprivileged myuser.
FROM apify/actor-node-playwright-chrome:20

COPY --chown=myuser package*.json ./
RUN npm install --omit=dev --omit=optional \
    && echo "Node version: $(node --version)" \
    && echo "NPM version: $(npm --version)"

COPY --chown=myuser . ./

CMD ["node", "main.js"]
