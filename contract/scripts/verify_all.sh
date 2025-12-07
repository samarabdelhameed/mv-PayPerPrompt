#!/bin/bash

echo "🔍 Verifying PayPerPrompt contracts..."

# Compile contracts
echo "Compiling Move modules..."
aptos move compile --package-dir .

# Run tests
echo "Running unit tests..."
aptos move test --package-dir .

# Verify deployment
echo "Verifying deployment..."
aptos account list --account default

echo "✅ Verification complete"
