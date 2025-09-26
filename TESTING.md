# Testing Guide

This document provides detailed information about the testing infrastructure for the Dynamic Knowledge Base System.

## Testing Scripts

### quick-test.sh
A lightweight smoke test that verifies basic functionality:

**What it tests:**
- Server health check
- User registration and login flow
- Basic topic creation and retrieval
- Resource creation
- Statistics endpoints

**Usage:**
```bash
./quick-test.sh
```

**Duration:** ~5-10 seconds

### test-api.sh
Comprehensive test suite covering all API functionality:

**What it tests:**
- **User Operations** (6 tests)
  - User registration for different roles
  - Login functionality
  - Duplicate registration prevention
  - Invalid login rejection

- **Topic Operations** (12 tests)
  - CRUD operations for topics
  - Role-based permission enforcement
  - Hierarchical topic relationships
  - Recursive topic retrieval
  - Topic search functionality

- **Resource Operations** (8 tests)
  - Resource creation and management
  - Different resource types (articles, videos)
  - Resource search and validation
  - URL validation

- **Advanced Features** (12 tests)
  - Shortest path algorithm between topics
  - Topic versioning and history
  - Version revert functionality
  - Bulk operations
  - Data cleanup operations
  - Statistics generation
  - Error handling edge cases

**Usage:**
```bash
./test-api.sh
```

**Duration:** ~30-45 seconds
**Total Tests:** 38

## Test Output Format

### Status Indicators
- `PASS`: Test completed successfully
- `FAIL`: Test failed (shows expected vs actual results)
- `INFO`: Informational message during test execution

### Example Output
```
========================================
  Dynamic Knowledge Base API Test Suite
========================================

INFO: Checking if server is running...
PASS: Server is running and responding

INFO: Testing health endpoint...
PASS: Health check endpoint

INFO: Testing user operations...
PASS: Admin user login (ID: abc123...)
PASS: Duplicate user registration prevention
PASS: User login
PASS: Invalid login rejection

...

========================================
              TEST SUMMARY
========================================
Total Tests: 38
Passed: 38
Failed: 0
All tests passed!
```

## Prerequisites

### Required Software
1. **Node.js 20.12.2+**
   ```bash
   nvm use v20.12.2
   ```

2. **jq** (JSON processor)
   ```bash
   # Ubuntu/Debian
   sudo apt install jq
   
   # macOS
   brew install jq
   
   # CentOS/RHEL
   sudo yum install jq
   ```

3. **curl** (usually pre-installed)

### Server Setup
The server must be running before executing tests:

```bash
# Start development server
npm run dev

# Or use the startup script
./start-server.sh
```

## Test Data Management

### Automatic User Creation
The test scripts automatically handle user registration and ID extraction:

1. **Attempts Registration**: Tries to register test users
2. **Handles Conflicts**: If users exist, attempts login instead
3. **Extracts IDs**: Dynamically obtains user IDs for authenticated requests
4. **Uses Real IDs**: All subsequent tests use actual user IDs from the database

### Test Users
The scripts create/use these test accounts:

- **Admin User**
  - Email: `admin@apitest.com`
  - Role: Admin
  - Password: `admin123`

- **Editor User**
  - Email: `editor@apitest.com`
  - Role: Editor
  - Password: `editor123`

- **Viewer User**
  - Email: `viewer@apitest.com`
  - Role: Viewer
  - Password: `viewer123`

## Debugging Failed Tests

### Common Issues

1. **Server Not Running**
   ```
   INFO: Attempting to connect to http://localhost:3000/api/health (attempt 1/5)...
   FAIL: Server is not responding after 5 attempts
   ```
   **Solution**: Start the server with `npm run dev`

2. **Missing Dependencies**
   ```
   ./test-api.sh: line 15: jq: command not found
   ```
   **Solution**: Install jq (`sudo apt install jq`)

3. **Port Conflicts**
   ```
   EADDRINUSE: address already in use :::3000
   ```
   **Solution**: Kill existing processes or change port

### Viewing Detailed Errors
For detailed error information, check the server logs while tests are running. The server outputs comprehensive error details including:

- Request details (method, URL, headers, body)
- Error stack traces
- Timestamp information
- User context

### Manual Testing
You can also test individual endpoints manually:

```bash
# Health check
curl http://localhost:3000/api/health

# Register user
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"test123","role":"Admin"}'

# Create topic
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -H "x-user-id: your-user-id" \
  -d '{"name":"Test Topic","content":"Test content"}'
```

## Continuous Integration

For CI/CD pipelines, use the following sequence:

```bash
#!/bin/bash
set -e

# Setup
nvm use v20.12.2
npm ci

# Build and verify
npm run build
npx tsc --noEmit

# Start server in background
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Run tests
./test-api.sh

# Cleanup
kill $SERVER_PID
```

## Performance Considerations

- **Quick Test**: Suitable for rapid feedback during development
- **Full Test Suite**: Recommended for pre-commit hooks and CI/CD
- **Parallel Execution**: Tests run sequentially to avoid race conditions
- **Resource Cleanup**: Tests clean up created resources automatically
