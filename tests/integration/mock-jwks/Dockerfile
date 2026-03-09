FROM node:22.22.0-alpine3.23

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY server.js ./

HEALTHCHECK --interval=5s --timeout=5s --retries=5 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/certs || \
    exit 1

USER node

EXPOSE 3001

CMD ["node", "server.js"]
