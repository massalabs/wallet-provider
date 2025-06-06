#!/bin/bash
set -e

# Install dependencies and build the project
npm ci
npm run build

TAG=next

# Update the version with a premajor, preid next, no git tag, and no commit hooks
npm version --preid $TAG --no-git-tag-version --no-commit-hooks premajor

# Use timestamp as package suffix
TIME=$(date -u +%Y%m%d%H%M%S)
sed -i "/version/s/$TAG.0/$TAG.$TIME/g" package.json

PACKAGE_NAME=$(cat package.json | jq -r '.name')
PUBLISH_VERSION=$(cat package.json | jq -r '.version')
echo publishing ${PACKAGE_NAME}@$PUBLISH_VERSION

# Publish the package
npm publish --access public --tag $TAG