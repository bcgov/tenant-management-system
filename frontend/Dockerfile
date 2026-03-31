FROM node:22.22.2-trixie AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy configuration files and application source
COPY env.d.ts index.html tsconfig*.json vite.config.ts ./
COPY public ./public
COPY src ./src

RUN npm run build

# -----------------------------------------------------------------------------

FROM caddy:2.11.2-alpine

RUN setcap -r /usr/bin/caddy

WORKDIR /srv

COPY --from=build /app/dist .
COPY Caddyfile /etc/caddy/Caddyfile
RUN caddy fmt --overwrite /etc/caddy/Caddyfile

USER caddy

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || \
    exit 1

EXPOSE 3000 3001
