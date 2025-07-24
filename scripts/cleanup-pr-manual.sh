#!/bin/bash
# Manual cleanup script for PR environments
# Usage: ./scripts/cleanup-pr-manual.sh <PR_NUMBER>

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <PR_NUMBER>"
    exit 1
fi

PR_NUMBER=$1
NAMESPACE="b5522d-dev"  # Update to your namespace
REPO_NAME="tenant-management-system"  # Update to your repo name

echo "🧹 Manually cleaning up PR ${PR_NUMBER} resources..."

# Set the release name (should match your workflow)
RELEASE_NAME="${REPO_NAME}-pr-${PR_NUMBER}"

echo "Release name: ${RELEASE_NAME}"

# Uninstall Helm release
echo "📦 Uninstalling Helm release..."
helm uninstall ${RELEASE_NAME} -n ${NAMESPACE} || echo "Helm release not found or already deleted"

# Clean up any remaining resources with PR labels
echo "🗑️  Cleaning up remaining resources..."
oc delete all,secrets,configmaps,pvc,routes -l pr=${PR_NUMBER} -n ${NAMESPACE} || true

# Clean up Crunchy PostgreSQL resources
echo "🗄️  Cleaning up database resources..."
oc delete postgrescluster ${RELEASE_NAME}-crunchy -n ${NAMESPACE} || echo "PostgreSQL cluster not found"

# List any remaining resources
echo "📋 Remaining resources for PR ${PR_NUMBER}:"
oc get all,secrets,configmaps,pvc -l pr=${PR_NUMBER} -n ${NAMESPACE} || echo "No remaining resources found"

echo "✅ Manual cleanup complete for PR ${PR_NUMBER}!"