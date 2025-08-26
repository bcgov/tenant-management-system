FROM --platform=linux/amd64 node:18-alpine

WORKDIR /app/tms-api

# Install build dependencies
RUN apk add --no-cache python3 make g++ curl

# Copy package files
COPY package*.json ./

# Try simple npm install first
RUN npm install

# Copy application source code
COPY . .

# Set proper permissions
RUN chmod -R 755 /app/tms-api/

# Create logs directory with proper permissions
RUN mkdir -p /app/tms-api/logs && \
    chmod -R 777 /app/tms-api/logs

EXPOSE 4144

ENTRYPOINT [ "sh", "start_api.sh" ]