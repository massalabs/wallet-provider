#!/bin/bash

# Script to update @massalabs/massa-web3 to the latest dev version
# This script checks if the package is currently installed in dev version
# and updates it to the latest @massalabs/massa-web3@dev

set -e  # Exit on any error

# Check if git directory is clean
if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: Git directory is not clean. Please commit or stash your changes before running this script."
    echo "📝 Uncommitted changes detected:"
    git status --porcelain
    exit 1
fi

# Install the latest dev version
echo "🔄 Installing latest @massalabs/massa-web3@dev"
npm install @massalabs/massa-web3@dev
git checkout package.json
npm install

echo "🔄 Installing latest @massalabs/massa-web3@dev in sandbox"
pushd sandbox
npm install @massalabs/massa-web3@dev
git checkout package.json
npm install
popd

echo "Creating a new commit with the new @dev version"
git add -u
git commit -m "Update @massalabs/massa-web3@dev"

echo "🎉 Update process completed successfully!"
