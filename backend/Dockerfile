FROM node:18-alpine

WORKDIR /app/tms-api

COPY . .

RUN set -x \
        && chmod -R 755 /app/tms-api/

ENV NPM_PACKAGES=/.npm-packages \
    PATH=$NPM_PACKAGES/bin:$PATH \
    NODE_PATH=$NPM_PACKAGES/lib/node_modules:$NODE_PATH
RUN echo "prefix = $NPM_PACKAGES" >> ~/.npmrc

COPY ./package.json $NPM_PACKAGES/
COPY ./package-lock.json $NPM_PACKAGES/

RUN ln -sf $NPM_PACKAGES/node_modules node_modules

RUN npm ci --prefix=$NPM_PACKAGES

EXPOSE 4144

ENTRYPOINT [ "sh", "start_api.sh" ]