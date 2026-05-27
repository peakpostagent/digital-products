# CSS Variables Inspector — Playwright-based Apify Actor
FROM apify/actor-node-playwright-chrome:20

COPY --chown=myuser package*.json ./
RUN npm install --omit=dev --omit=optional \
    && npx playwright install chromium

COPY --chown=myuser . ./

CMD ["node", "main.js"]
