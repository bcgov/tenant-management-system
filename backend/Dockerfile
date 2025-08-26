FROM node:18-alpine

WORKDIR /app/tms-api

# Install build dependencies
RUN apk add --no-cache python3 make g++ curl

# Copy package files
COPY package*.json ./

# Fix the @types/node compatibility issue by overriding it
RUN npm install @types/node@^18.0.0 --save-dev --no-package-lock

# Then install everything else with verbose logging
RUN npm config set loglevel verbose && npm install --legacy-peer-deps

# Copy application source code
COPY . .

# Set proper permissions
RUN chmod -R 755 /app/tms-api/

# Create logs directory with proper permissions
RUN mkdir -p /app/tms-api/logs && \
    chmod -R 777 /app/tms-api/logs

EXPOSE 4144

ENTRYPOINT [ "sh", "start_api.sh" ]