# Security Headers Scanner — minimal Node Actor image
# Based on Apify's official Node 20 image.

FROM apify/actor-node:20

# Copy package files first for better layer caching
COPY --chown=myuser package*.json ./

# Install production deps only
RUN npm install --omit=dev --omit=optional \
    && echo "Node version: $(node --version)" \
    && echo "NPM version: $(npm --version)"

# Copy the rest of the actor source
COPY --chown=myuser . ./

# Run the actor
CMD ["node", "main.js"]
