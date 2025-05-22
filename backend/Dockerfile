FROM node:18-alpine

WORKDIR /app/tms-api

COPY . .

RUN set -x \
        && chmod -R 755 /app/tms-api/

ENV NPM_PACKAGES=/.npm-packages
ENV PATH=${NPM_PACKAGES}/bin:${PATH}
ENV NODE_PATH=${NPM_PACKAGES}/lib/node_modules:${NODE_PATH}

RUN echo "prefix = $NPM_PACKAGES" >> ~/.npmrc

COPY ./package.json $NPM_PACKAGES/
COPY ./package-lock.json $NPM_PACKAGES/

RUN ln -sf $NPM_PACKAGES/node_modules node_modules

RUN npm ci --prefix=$NPM_PACKAGES

# Create logs directory with proper permissions
RUN mkdir -p /app/tms-api/logs && \
    chmod -R 777 /app/tms-api/logs

EXPOSE 4144

ENTRYPOINT [ "sh", "start_api.sh" ]