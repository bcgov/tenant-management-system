FROM node:24.22.1-trixie

# Keep installed browsers accessible after switching to the runtime user.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --ignore-scripts

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --ignore-scripts

WORKDIR /app/tests/e2e
COPY tests/e2e/package*.json ./
RUN npm ci --ignore-scripts && npx --no-install playwright install --with-deps chromium

COPY backend /app/backend
COPY frontend /app/frontend
COPY tests/e2e /app/tests/e2e
# Backend npm scripts require an env file; all values come from Compose.
RUN touch /app/backend/.env && chown -R node:node /app

USER node
HEALTHCHECK NONE
ENTRYPOINT ["node", "start-container.mjs"]
