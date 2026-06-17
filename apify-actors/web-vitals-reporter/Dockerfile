# Web Vitals Reporter — Playwright-based Apify Actor
FROM apify/actor-node-playwright-chrome:20

COPY --chown=myuser package*.json ./
RUN npm install --omit=dev --omit=optional \
    && echo "Node version: $(node --version)" \
    && echo "NPM version: $(npm --version)"

COPY --chown=myuser . ./

CMD ["node", "main.js"]
