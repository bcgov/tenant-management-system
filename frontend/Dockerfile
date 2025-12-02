# Build stage: build static files with Node
FROM node:22.21.1-trixie-slim AS build

WORKDIR /app

# Install curl for healthcheck and other dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    g++ \
    make \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Increase Node.js memory limit for large builds
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Configure npm for reliability
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retry-maxtimeout 600000 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-timeout 600000

# First copy package files and install dependencies
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci --ignore-scripts

# Then copy source code and build
COPY . ./
RUN npm run build

# Deploy stage: serve static files with Caddy
FROM caddy:2.10.2-alpine

RUN apk add --no-cache ca-certificates curl

# Copy built static files and Caddyfile
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
RUN caddy fmt --overwrite /etc/caddy/Caddyfile

EXPOSE 3000 3001

HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:3001/health

# Use non-root user for security
USER 1001