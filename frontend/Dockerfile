# Build stage: build static files with Node
FROM node:22-slim AS build

WORKDIR /app

# First copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Then copy source code and build
COPY . ./
RUN npm run build

# Deploy stage: serve static files with Caddy
FROM caddy:2.10.0-alpine

RUN apk add --no-cache ca-certificates

# Copy built static files and Caddyfile
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
RUN caddy fmt --overwrite /etc/caddy/Caddyfile

EXPOSE 3000

# Use non-root user for security
USER 1001