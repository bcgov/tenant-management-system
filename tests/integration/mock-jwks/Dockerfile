FROM node:22.22.0-alpine3.23

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY server.js ./

HEALTHCHECK --interval=5s --retries=5 --timeout=5s \
    CMD wget --no-verbose --spider --tries=1 http://localhost:7002/certs || \
    exit 1

USER node

EXPOSE 7002

CMD ["node", "server.js"]
