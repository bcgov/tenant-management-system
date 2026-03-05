FROM node:22.22.0-alpine3.23

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY server.js ./

EXPOSE 3001

CMD ["node", "server.js"]
