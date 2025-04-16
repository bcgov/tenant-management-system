#!/bin/bash
set -ex

cd frontend
rm -rf node_modules
npm ci
