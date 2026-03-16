#!/bin/sh

docker compose up -d --wait --build db mock-jwks

export POSTGRES_DATABASE=tmsdb
export POSTGRES_HOST=localhost
export POSTGRES_PASSWORD=testsecretpassword
export POSTGRES_PORT=7003
export POSTGRES_USER=tms

cd "$(dirname "$0")/../../backend"
npm run migrate
