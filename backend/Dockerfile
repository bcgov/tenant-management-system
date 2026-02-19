FROM node:20 AS builder

WORKDIR /app/tms-api

COPY package*.json ./
RUN npm ci --ignore-scripts --omit=dev

FROM node:20-alpine AS runtime

WORKDIR /app/tms-api

RUN apk add --no-cache curl

COPY --from=builder /app/tms-api/node_modules ./node_modules
COPY . .

EXPOSE 4144

USER node

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:4144/v1/health || exit 1

ENTRYPOINT [ "sh", "start_api.sh" ]
