#!/bin/bash
set -ex

REPOSITORY_ROOT=$(pwd)

cd $REPOSITORY_ROOT/backend
rm -rf node_modules
npm ci

cd $REPOSITORY_ROOT/frontend
rm -rf node_modules
npm ci
