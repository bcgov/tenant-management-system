FROM node:20.19.1-bookworm

# Install some extras such as vim for interactive rebases. Also some
# Cypress prerequisites for running in Debian containers:
# https://docs.cypress.io/app/get-started/install-cypress#UbuntuDebian
# and we set up k6 for performance testing
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        libasound2 \
        libgbm-dev \
        libgtk-3-0 \
        libgtk2.0-0 \
        libnotify-dev \
        libnss3 \
        libxss1 \
        libxtst6 \
        openjdk-17-jre-headless \
        vim \
        xauth \
        xvfb \
    && apt-get clean

# The GitHub tool Trivy sees a Dockerfile and wants a health check, even though
# it isn't that useful for a devcontainer. Make Trivy happy.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node --version || exit 1
