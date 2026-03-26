FROM node:22.22.0-trixie

# Install some extras such as vim for interactive rebases. Also some
# Cypress prerequisites for running in Debian containers:
# https://docs.cypress.io/app/get-started/install-cypress#UbuntuDebian
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    libasound2 \
    libgbm-dev \
    libgtk-3-0 \
    libnotify-dev \
    libnss3 \
    libxss1 \
    libxtst6 \
    postgresql-client \
    socat \
    sudo \
    vim \
    xauth \
    xvfb \
    && apt-get clean

# Set up Docker in Docker so that the integration tests can run in the
# containers that they need.
RUN echo "node ALL=(root) NOPASSWD: /usr/bin/dockerd" > \
    /etc/sudoers.d/node-dockerd && \
    chmod 0440 /etc/sudoers.d/node-dockerd

# The security tool Trivy sees a Dockerfile and wants a health check, even
# though it isn't that useful for a dev container. Make Trivy happy.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node --version || exit 1

USER node
