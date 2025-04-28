#!/bin/bash

# This script creates a new version of the documentation

# Check if version number is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <version-number>"
  echo "Example: $0 1.0.0"
  exit 1
fi

VERSION=$1

# Run Docusaurus versioning command
echo "Creating version $VERSION of the documentation..."
npx docusaurus docs:version $VERSION

echo "Version $VERSION created successfully!"
echo "You can now edit the versioned documentation in docs-site/versioned_docs/version-$VERSION/" 