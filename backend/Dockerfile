FROM node:20.20.0-trixie AS build

WORKDIR /app/tms-api

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy application source code
COPY src ./src
COPY tsconfig.json ./

RUN npm run build && \
    mkdir -p dist/docs && \
    cp src/docs/openapi.yaml dist/docs

# -----------------------------------------------------------------------------

FROM node:20.20.0-alpine3.23
WORKDIR /app/tms-api

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/tms-api/dist ./dist

USER node

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4144/v1/health || \
  exit 1

EXPOSE 4144

CMD ["npm", "run", "prod:start"]
