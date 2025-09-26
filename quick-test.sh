#!/bin/bash

# Quick API Test Script for Dynamic Knowledge Base System
# This script performs basic smoke tests

set -e

BASE_URL="http://localhost:3000/api"

echo "Quick API Smoke Test"
echo "======================="

# Check server
echo "1. Checking server health..."
curl -s "$BASE_URL/health" | jq '.success' || echo "Server not running"

# Test user registration and get user ID
echo "2. Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/users/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Admin","email":"admin@quicktest.com","password":"admin123","role":"Admin"}')

ADMIN_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.data.id' 2>/dev/null || echo "")

if [ -z "$ADMIN_ID" ] || [ "$ADMIN_ID" = "null" ]; then
    echo "User registration failed. Trying to login instead..."
    # Try to login to get user info
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/users/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"admin@quicktest.com","password":"admin123"}')
    ADMIN_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user.id' 2>/dev/null || echo "")
fi

if [ -z "$ADMIN_ID" ] || [ "$ADMIN_ID" = "null" ]; then
    echo "Cannot get admin user ID. Exiting."
    exit 1
fi

echo "Admin user ready with ID: $ADMIN_ID"

# Test topic creation
echo "3. Testing topic creation..."
TOPIC_RESPONSE=$(curl -s -X POST "$BASE_URL/topics" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $ADMIN_ID" \
  -d '{"name":"Test Topic","content":"This is a test topic"}')

TOPIC_ID=$(echo "$TOPIC_RESPONSE" | jq -r '.data.id' 2>/dev/null || echo "")

if [ -n "$TOPIC_ID" ] && [ "$TOPIC_ID" != "null" ]; then
    echo "Topic created with ID: $TOPIC_ID"
    
    # Test resource creation
    echo "4. Testing resource creation..."
    curl -s -X POST "$BASE_URL/resources" \
      -H "Content-Type: application/json" \
      -H "x-user-id: $ADMIN_ID" \
      -d "{\"topicId\":\"$TOPIC_ID\",\"url\":\"https://example.com\",\"description\":\"Test resource\",\"type\":\"article\"}" \
      | jq '.success' && echo "Resource created"
    
    # Test topic retrieval
    echo "5. Testing topic retrieval..."
    curl -s "$BASE_URL/topics/$TOPIC_ID" \
      -H "x-user-id: $ADMIN_ID" \
      | jq '.success' && echo "Topic retrieved"
else
    echo "Topic creation failed"
fi

# Test statistics
echo "6. Testing statistics..."
curl -s "$BASE_URL/topics/stats" \
  -H "x-user-id: $ADMIN_ID" \
  | jq '.success' && echo "Statistics retrieved"

echo ""
echo "Quick test completed!"
echo "For comprehensive testing, run: ./test-api.sh"
