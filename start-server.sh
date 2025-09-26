#!/bin/bash

# Simple script to start the development server
# This handles the npm config issue by using ts-node-dev directly

echo "Starting Dynamic Knowledge Base API Server..."
echo "=================================="

# Check if TypeScript compiles
echo "1. Checking TypeScript compilation..."
if npx tsc --noEmit; then
    echo "TypeScript compilation successful"
else
    echo "TypeScript compilation failed"
    exit 1
fi

# Start the server
echo "2. Starting development server..."
echo "   Server will be available at: http://localhost:3000"
echo "   API endpoints at: http://localhost:3000/api"
echo "   Press Ctrl+C to stop the server"
echo ""

# Use ts-node-dev directly to avoid npm config issues
npx ts-node-dev --respawn --transpile-only --ignore-watch node_modules src/index.ts
