#!/bin/bash

# Dynamic Knowledge Base System API Test Script
# This script tests various API endpoints and scenarios

# Note: We'll handle errors manually to provide better feedback

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000/api"
ADMIN_USER_ID=""
EDITOR_USER_ID=""
VIEWER_USER_ID=""

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}PASS${NC}: $message"
        ((PASSED_TESTS++))
        ((TOTAL_TESTS++))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}FAIL${NC}: $message"
        ((FAILED_TESTS++))
        ((TOTAL_TESTS++))
    elif [ "$status" = "INFO" ]; then
        echo -e "${BLUE}INFO${NC}: $message"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}WARN${NC}: $message"
    fi
}

# Function to make API requests
api_request() {
    local method=$1
    local endpoint=$2
    local user_id=$3
    local data=$4
    local expected_status=${5:-200}
    
    local headers="-H 'Content-Type: application/json'"
    if [ -n "$user_id" ]; then
        headers="$headers -H 'x-user-id: $user_id'"
    fi
    
    local curl_cmd="curl -s -w '%{http_code}' -X $method $headers"
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    curl_cmd="$curl_cmd '$BASE_URL$endpoint'"
    
    local response=$(eval $curl_cmd)
    local status_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$status_code" -eq "$expected_status" ]; then
        return 0
    else
        echo "Expected: $expected_status, Got: $status_code"
        echo "Response: $body"
        return 1
    fi
}

# Function to check if server is running
check_server() {
    print_status "INFO" "Checking if server is running..."
    
    # Try multiple times to connect to server
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        print_status "INFO" "Attempting to connect to $BASE_URL/health (attempt $attempt/$max_attempts)..."
        
        local health_response=$(curl -s -w "%{http_code}" "$BASE_URL/health" 2>/dev/null || echo "000")
        local status_code="${health_response: -3}"
        
        if [ "$status_code" = "200" ]; then
            print_status "PASS" "Server is running and responding"
            return 0
        else
            if [ $attempt -eq $max_attempts ]; then
                print_status "FAIL" "Server is not responding after $max_attempts attempts (status: $status_code)"
                print_status "INFO" "Please start the server with one of these commands:"
                print_status "INFO" "  npm run dev"
                print_status "INFO" "  npx ts-node-dev src/index.ts"
                print_status "INFO" "  npx tsc && node dist/index.js"
                exit 1
            else
                print_status "WARN" "Attempt $attempt failed (status: $status_code), retrying in 2 seconds..."
                sleep 2
                ((attempt++))
            fi
        fi
    done
}

# Test health endpoint
test_health() {
    print_status "INFO" "Testing health endpoint..."
    if api_request "GET" "/health" "" "" 200; then
        print_status "PASS" "Health check endpoint"
    else
        print_status "FAIL" "Health check endpoint"
    fi
}

# Test API info endpoint
test_info() {
    print_status "INFO" "Testing API info endpoint..."
    if api_request "GET" "/info" "" "" 200; then
        print_status "PASS" "API info endpoint"
    else
        print_status "FAIL" "API info endpoint"
    fi
}

# Test user registration and login
test_user_operations() {
    print_status "INFO" "Testing user operations..."
    
    # Test user registration and extract user IDs
    local admin_data='{"name":"Test Admin","email":"admin@apitest.com","password":"admin123","role":"Admin"}'
    local admin_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$admin_data" "$BASE_URL/users/register")
    local admin_success=$(echo "$admin_response" | grep -o '"success":true' || echo "")
    
    if [ -n "$admin_success" ]; then
        ADMIN_USER_ID=$(echo "$admin_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        print_status "PASS" "Admin user registration (ID: $ADMIN_USER_ID)"
    else
        # Try to login to get existing user
        local login_data='{"email":"admin@apitest.com","password":"admin123"}'
        local login_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$login_data" "$BASE_URL/users/login")
        ADMIN_USER_ID=$(echo "$login_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ -n "$ADMIN_USER_ID" ]; then
            print_status "PASS" "Admin user login (ID: $ADMIN_USER_ID)"
        else
            print_status "FAIL" "Admin user registration"
        fi
    fi
    
    local editor_data='{"name":"Test Editor","email":"editor@apitest.com","password":"editor123","role":"Editor"}'
    local editor_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$editor_data" "$BASE_URL/users/register")
    local editor_success=$(echo "$editor_response" | grep -o '"success":true' || echo "")
    
    if [ -n "$editor_success" ]; then
        EDITOR_USER_ID=$(echo "$editor_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        print_status "PASS" "Editor user registration (ID: $EDITOR_USER_ID)"
    else
        # Try to login to get existing user
        local login_data='{"email":"editor@apitest.com","password":"editor123"}'
        local login_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$login_data" "$BASE_URL/users/login")
        EDITOR_USER_ID=$(echo "$login_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ -n "$EDITOR_USER_ID" ]; then
            print_status "PASS" "Editor user login (ID: $EDITOR_USER_ID)"
        else
            print_status "FAIL" "Editor user login"
        fi
    fi
    
    local viewer_data='{"name":"Test Viewer","email":"viewer@apitest.com","password":"viewer123","role":"Viewer"}'
    local viewer_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$viewer_data" "$BASE_URL/users/register")
    local viewer_success=$(echo "$viewer_response" | grep -o '"success":true' || echo "")
    
    if [ -n "$viewer_success" ]; then
        VIEWER_USER_ID=$(echo "$viewer_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        print_status "PASS" "Viewer user registration (ID: $VIEWER_USER_ID)"
    else
        # Try to login to get existing user
        local login_data='{"email":"viewer@apitest.com","password":"viewer123"}'
        local login_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$login_data" "$BASE_URL/users/login")
        VIEWER_USER_ID=$(echo "$login_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ -n "$VIEWER_USER_ID" ]; then
            print_status "PASS" "Viewer user login (ID: $VIEWER_USER_ID)"
        else
            print_status "FAIL" "Viewer user login"
        fi
    fi
    
    # Test duplicate registration
    if api_request "POST" "/users/register" "" "$admin_data" 409; then
        print_status "PASS" "Duplicate user registration prevention"
    else
        print_status "FAIL" "Duplicate user registration prevention"
    fi
    
    # Test user login (already tested above, but test again for completeness)
    local login_data='{"email":"admin@apitest.com","password":"admin123"}'
    if api_request "POST" "/users/login" "" "$login_data" 200; then
        print_status "PASS" "User login"
    else
        print_status "FAIL" "User login"
    fi
    
    # Test invalid login
    local invalid_login='{"email":"admin@apitest.com","password":"wrongpassword"}'
    if api_request "POST" "/users/login" "" "$invalid_login" 401; then
        print_status "PASS" "Invalid login rejection"
    else
        print_status "FAIL" "Invalid login rejection"
    fi
}

# Test topic operations
test_topic_operations() {
    print_status "INFO" "Testing topic operations..."
    
    # Test topic creation by admin
    local topic_data='{"name":"Programming Fundamentals","content":"Basic programming concepts and principles"}'
    if api_request "POST" "/topics" "$ADMIN_USER_ID" "$topic_data" 201; then
        print_status "PASS" "Topic creation by admin"
    else
        print_status "FAIL" "Topic creation by admin"
    fi
    
    # Test topic creation by editor
    local topic_data2='{"name":"Advanced JavaScript","content":"Advanced JavaScript concepts and patterns"}'
    if api_request "POST" "/topics" "$EDITOR_USER_ID" "$topic_data2" 201; then
        print_status "PASS" "Topic creation by editor"
    else
        print_status "FAIL" "Topic creation by editor"
    fi
    
    # Test topic creation by viewer (should fail)
    local topic_data3='{"name":"Unauthorized Topic","content":"This should fail"}'
    if api_request "POST" "/topics" "$VIEWER_USER_ID" "$topic_data3" 403; then
        print_status "PASS" "Topic creation rejection for viewer"
    else
        print_status "FAIL" "Topic creation rejection for viewer"
    fi
    
    # Test getting all topics
    if api_request "GET" "/topics" "$ADMIN_USER_ID" "" 200; then
        print_status "PASS" "Get all topics"
    else
        print_status "FAIL" "Get all topics"
    fi
    
    # Test getting root topics
    if api_request "GET" "/topics/root" "$ADMIN_USER_ID" "" 200; then
        print_status "PASS" "Get root topics"
    else
        print_status "FAIL" "Get root topics"
    fi
    
    # Test topic validation errors
    local invalid_topic='{"name":"","content":""}'
    if api_request "POST" "/topics" "$ADMIN_USER_ID" "$invalid_topic" 400; then
        print_status "PASS" "Topic validation error handling"
    else
        print_status "FAIL" "Topic validation error handling"
    fi
}

# Test hierarchical topic operations
test_hierarchical_topics() {
    print_status "INFO" "Testing hierarchical topic operations..."
    
    # Create parent topic
    local parent_topic='{"name":"Web Development","content":"Complete web development guide"}'
    local parent_response=$(curl -s -X POST -H "Content-Type: application/json" -H "x-user-id: $ADMIN_USER_ID" -d "$parent_topic" "$BASE_URL/topics")
    local parent_id=$(echo "$parent_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$parent_id" ]; then
        print_status "PASS" "Parent topic creation"
        
        # Create child topic
        local child_topic="{\"name\":\"React Basics\",\"content\":\"Introduction to React\",\"parentTopicId\":\"$parent_id\"}"
        if api_request "POST" "/topics" "$ADMIN_USER_ID" "$child_topic" 201; then
            print_status "PASS" "Child topic creation"
        else
            print_status "FAIL" "Child topic creation"
        fi
        
        # Test recursive topic retrieval
        if api_request "GET" "/topics/$parent_id/recursive" "$ADMIN_USER_ID" "" 200; then
            print_status "PASS" "Recursive topic retrieval"
        else
            print_status "FAIL" "Recursive topic retrieval"
        fi
        
    else
        print_status "FAIL" "Parent topic creation"
    fi
}

# Test resource operations
test_resource_operations() {
    print_status "INFO" "Testing resource operations..."
    
    # First create a topic to attach resources to
    local topic_data='{"name":"Resource Test Topic","content":"Topic for testing resources"}'
    local topic_response=$(curl -s -X POST -H "Content-Type: application/json" -H "x-user-id: $ADMIN_USER_ID" -d "$topic_data" "$BASE_URL/topics")
    local topic_id=$(echo "$topic_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$topic_id" ]; then
        # Test resource creation
        local resource_data="{\"topicId\":\"$topic_id\",\"url\":\"https://example.com/tutorial.html\",\"description\":\"Great tutorial on the topic\",\"type\":\"article\"}"
        if api_request "POST" "/resources" "$ADMIN_USER_ID" "$resource_data" 201; then
            print_status "PASS" "Resource creation"
        else
            print_status "FAIL" "Resource creation"
        fi
        
        # Test video resource creation
        local video_data="{\"topicId\":\"$topic_id\",\"url\":\"https://youtube.com/watch?v=example\",\"description\":\"Educational video\"}"
        if api_request "POST" "/resources/video" "$ADMIN_USER_ID" "$video_data" 201; then
            print_status "PASS" "Video resource creation"
        else
            print_status "FAIL" "Video resource creation"
        fi
        
        # Test getting resources by topic
        if api_request "GET" "/resources/topic/$topic_id" "$ADMIN_USER_ID" "" 200; then
            print_status "PASS" "Get resources by topic"
        else
            print_status "FAIL" "Get resources by topic"
        fi
        
        # Test resource search
        if api_request "GET" "/resources/search?q=tutorial" "$ADMIN_USER_ID" "" 200; then
            print_status "PASS" "Resource search"
        else
            print_status "FAIL" "Resource search"
        fi
        
        # Test URL validation
        local url_validation='{"url":"https://example.com/valid-url"}'
        if api_request "POST" "/resources/validate-url" "$ADMIN_USER_ID" "$url_validation" 200; then
            print_status "PASS" "URL validation"
        else
            print_status "FAIL" "URL validation"
        fi
        
    else
        print_status "FAIL" "Topic creation for resource tests"
    fi
}

# Test shortest path algorithm
test_shortest_path() {
    print_status "INFO" "Testing shortest path algorithm..."
    
    # Create topics with relationships for path testing
    local topic1='{"name":"Computer Science","content":"Root CS topic"}'
    local topic2='{"name":"Programming","content":"Programming basics"}'
    local topic3='{"name":"Data Structures","content":"Data structures and algorithms"}'
    
    # Create topics and get their IDs
    local response1=$(curl -s -X POST -H "Content-Type: application/json" -H "x-user-id: $ADMIN_USER_ID" -d "$topic1" "$BASE_URL/topics")
    local response2=$(curl -s -X POST -H "Content-Type: application/json" -H "x-user-id: $ADMIN_USER_ID" -d "$topic2" "$BASE_URL/topics")
    local response3=$(curl -s -X POST -H "Content-Type: application/json" -H "x-user-id: $ADMIN_USER_ID" -d "$topic3" "$BASE_URL/topics")
    
    local id1=$(echo "$response1" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    local id2=$(echo "$response2" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    local id3=$(echo "$response3" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$id1" ] && [ -n "$id2" ] && [ -n "$id3" ]; then
        # Create hierarchical relationship
        local child_topic="{\"name\":\"Programming\",\"content\":\"Updated content\",\"parentTopicId\":\"$id1\"}"
        curl -s -X PUT -H "Content-Type: application/json" -H "x-user-id: $ADMIN_USER_ID" -d "$child_topic" "$BASE_URL/topics/$id2" > /dev/null
        
        # Test shortest path
        if api_request "GET" "/topics/path?startTopicId=$id1&endTopicId=$id2" "$ADMIN_USER_ID" "" 200; then
            print_status "PASS" "Shortest path algorithm"
        else
            print_status "FAIL" "Shortest path algorithm"
        fi
        
        # Test path with no connection
        if api_request "GET" "/topics/path?startTopicId=$id1&endTopicId=00000000-0000-0000-0000-000000000000" "$ADMIN_USER_ID" "" 404; then
            print_status "PASS" "No path found handling"
        else
            print_status "FAIL" "No path found handling"
        fi
    else
        print_status "FAIL" "Topic creation for path tests"
    fi
}

# Test topic versioning
test_topic_versioning() {
    print_status "INFO" "Testing topic versioning..."
    
    # Create a topic
    local topic_data='{"name":"Versioning Test","content":"Original content"}'
    local response=$(curl -s -X POST -H "Content-Type: application/json" -H "x-user-id: $ADMIN_USER_ID" -d "$topic_data" "$BASE_URL/topics")
    local topic_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$topic_id" ]; then
        # Update the topic (creates new version)
        local update_data='{"name":"Versioning Test","content":"Updated content version 2"}'
        if api_request "PUT" "/topics/$topic_id" "$ADMIN_USER_ID" "$update_data" 200; then
            print_status "PASS" "Topic update (versioning)"
        else
            print_status "FAIL" "Topic update (versioning)"
        fi
        
        # Get all versions
        if api_request "GET" "/topics/$topic_id/versions" "$ADMIN_USER_ID" "" 200; then
            print_status "PASS" "Get all topic versions"
        else
            print_status "FAIL" "Get all topic versions"
        fi
        
        # Get specific version
        if api_request "GET" "/topics/$topic_id/versions/1" "$ADMIN_USER_ID" "" 200; then
            print_status "PASS" "Get specific topic version"
        else
            print_status "FAIL" "Get specific topic version"
        fi
        
        # Revert to previous version
        if api_request "POST" "/topics/$topic_id/revert/1" "$ADMIN_USER_ID" "" 200; then
            print_status "PASS" "Topic version revert"
        else
            print_status "FAIL" "Topic version revert"
        fi
    else
        print_status "FAIL" "Topic creation for versioning tests"
    fi
}

# Test error handling and edge cases
test_error_handling() {
    print_status "INFO" "Testing error handling..."
    
    # Test unauthorized access
    if api_request "GET" "/topics" "" "" 401; then
        print_status "PASS" "Unauthorized access rejection"
    else
        print_status "FAIL" "Unauthorized access rejection"
    fi
    
    # Test invalid JSON
    if api_request "POST" "/topics" "$ADMIN_USER_ID" "invalid-json" 400; then
        print_status "PASS" "Invalid JSON handling"
    else
        print_status "FAIL" "Invalid JSON handling"
    fi
    
    # Test nonexistent resource
    if api_request "GET" "/topics/00000000-0000-0000-0000-000000000000" "$ADMIN_USER_ID" "" 404; then
        print_status "PASS" "Nonexistent resource handling"
    else
        print_status "FAIL" "Nonexistent resource handling"
    fi
    
    # Test invalid UUID format
    if api_request "GET" "/topics/invalid-uuid-format" "$ADMIN_USER_ID" "" 400; then
        print_status "PASS" "Invalid UUID format handling"
    else
        print_status "FAIL" "Invalid UUID format handling"
    fi
}

# Test statistics endpoints
test_statistics() {
    print_status "INFO" "Testing statistics endpoints..."
    
    if api_request "GET" "/topics/stats" "$ADMIN_USER_ID" "" 200; then
        print_status "PASS" "Topic statistics"
    else
        print_status "FAIL" "Topic statistics"
    fi
    
    if api_request "GET" "/resources/stats" "$ADMIN_USER_ID" "" 200; then
        print_status "PASS" "Resource statistics"
    else
        print_status "FAIL" "Resource statistics"
    fi
}

# Test bulk operations
test_bulk_operations() {
    print_status "INFO" "Testing bulk operations..."
    
    # Create a topic for bulk resources
    local topic_data='{"name":"Bulk Test Topic","content":"Topic for bulk operations"}'
    local response=$(curl -s -X POST -H "Content-Type: application/json" -H "x-user-id: $ADMIN_USER_ID" -d "$topic_data" "$BASE_URL/topics")
    local topic_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$topic_id" ]; then
        # Test bulk resource creation
        local bulk_data="{\"resources\":[{\"topicId\":\"$topic_id\",\"url\":\"https://example1.com\",\"description\":\"Resource 1\",\"type\":\"article\"},{\"topicId\":\"$topic_id\",\"url\":\"https://example2.com\",\"description\":\"Resource 2\",\"type\":\"video\"}]}"
        if api_request "POST" "/resources/bulk" "$ADMIN_USER_ID" "$bulk_data" 201; then
            print_status "PASS" "Bulk resource creation"
        else
            print_status "FAIL" "Bulk resource creation"
        fi
    else
        print_status "FAIL" "Topic creation for bulk operations"
    fi
}

# Test cleanup operations
test_cleanup_operations() {
    print_status "INFO" "Testing cleanup operations..."
    
    if api_request "POST" "/resources/cleanup-orphaned" "$ADMIN_USER_ID" "" 200; then
        print_status "PASS" "Orphaned resources cleanup"
    else
        print_status "FAIL" "Orphaned resources cleanup"
    fi
    
    if api_request "GET" "/resources/duplicates" "$ADMIN_USER_ID" "" 200; then
        print_status "PASS" "Duplicate resources detection"
    else
        print_status "FAIL" "Duplicate resources detection"
    fi
}

# Main test execution
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Dynamic Knowledge Base API Test Suite${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    # Check if server is running
    check_server
    echo ""
    
    # Run all tests
    test_health
    test_info
    echo ""
    
    test_user_operations
    echo ""
    
    test_topic_operations
    echo ""
    
    test_hierarchical_topics
    echo ""
    
    test_resource_operations
    echo ""
    
    test_shortest_path
    echo ""
    
    test_topic_versioning
    echo ""
    
    test_error_handling
    echo ""
    
    test_statistics
    echo ""
    
    test_bulk_operations
    echo ""
    
    test_cleanup_operations
    echo ""
    
    # Print summary
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}              TEST SUMMARY${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "Total Tests: ${TOTAL_TESTS}"
    echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
    echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed.${NC}"
        exit 1
    fi
}

# Run the tests
main "$@"
