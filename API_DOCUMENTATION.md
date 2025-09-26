# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All protected endpoints require the `x-user-id` header:
```
x-user-id: <user-id>
```

## Response Format
All API responses follow this format:
```json
{
  "success": boolean,
  "data": any,
  "error": string,
  "message": string
}
```

## Topics API

### Create Topic
**POST** `/topics`

**Headers:** `x-user-id` (required)
**Permissions:** CREATE

**Request Body:**
```json
{
  "name": "string (required, 1-200 chars)",
  "content": "string (required, 1-10000 chars)",
  "parentTopicId": "string (optional, UUID)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "content": "string",
    "version": 1,
    "parentTopicId": "uuid or null",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  },
  "message": "Topic created successfully"
}
```

### Get Topic by ID
**GET** `/topics/:id`

**Headers:** `x-user-id` (required)
**Permissions:** READ

**Query Parameters:**
- `includeChildren`: boolean (default: false)
- `includeResources`: boolean (default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "content": "string",
    "version": number,
    "parentTopicId": "uuid or null",
    "createdAt": "datetime",
    "updatedAt": "datetime",
    "children": [],
    "resources": []
  }
}
```

### Update Topic
**PUT** `/topics/:id`

**Headers:** `x-user-id` (required)
**Permissions:** UPDATE

**Request Body:**
```json
{
  "name": "string (optional, 1-200 chars)",
  "content": "string (optional, 1-10000 chars)",
  "parentTopicId": "string (optional, UUID or null)"
}
```

**Response:** Same as Create Topic with incremented version

### Delete Topic
**DELETE** `/topics/:id`

**Headers:** `x-user-id` (required)
**Permissions:** DELETE (Admin only)

**Response:**
```json
{
  "success": true,
  "message": "Topic deleted successfully"
}
```

### Get Topic Hierarchy
**GET** `/topics/:id/hierarchy`

**Headers:** `x-user-id` (required)
**Permissions:** READ

Returns complete topic hierarchy with all subtopics and resources.

### Get Topic Versions
**GET** `/topics/:id/versions`

**Headers:** `x-user-id` (required)
**Permissions:** READ

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "originalTopicId": "uuid",
      "version": 2,
      "isCurrentVersion": true,
      "name": "string",
      "content": "string",
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  ]
}
```

### Revert Topic Version
**PUT** `/topics/:id/revert/:version`

**Headers:** `x-user-id` (required)
**Permissions:** UPDATE

Reverts topic to specified version (creates new version).

### Find Shortest Path
**POST** `/topics/find-path`

**Headers:** `x-user-id` (required)
**Permissions:** READ

**Request Body:**
```json
{
  "startId": "uuid (required)",
  "endId": "uuid (required)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "path": ["uuid1", "uuid2", "uuid3"],
    "distance": 2,
    "topics": [
      {
        "id": "uuid1",
        "name": "Topic 1",
        "content": "Content 1"
      }
    ]
  }
}
```

### Search Topics
**GET** `/topics/search?q=query`

**Query Parameters:**
- `q`: string (required, 1-200 chars)
- `limit`: number (optional, 1-100, default: 20)
- `offset`: number (optional, min: 0, default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "content": "string",
      "version": number,
      "parentTopicId": "uuid or null",
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  ]
}
```

## Resources API

### Create Resource
**POST** `/resources`

**Headers:** `x-user-id` (required)
**Permissions:** CREATE

**Request Body:**
```json
{
  "topicId": "uuid (required)",
  "url": "string (required, valid URL)",
  "description": "string (required, 1-500 chars)",
  "type": "video|article|pdf|link|image (required)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "topicId": "uuid",
    "url": "string",
    "description": "string",
    "type": "string",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### Get Resources by Topic
**GET** `/resources/topic/:topicId`

**Headers:** `x-user-id` (required)
**Permissions:** READ

Returns all resources associated with a specific topic.

### Create Resource with Auto-Type Detection
**POST** `/resources/auto`

**Headers:** `x-user-id` (required)
**Permissions:** CREATE

**Request Body:**
```json
{
  "topicId": "uuid (required)",
  "url": "string (required, valid URL)",
  "description": "string (required, 1-500 chars)"
}
```

Automatically detects resource type based on URL.

### Validate Resource URL
**POST** `/resources/validate-url`

**Headers:** `x-user-id` (required)
**Permissions:** READ

**Request Body:**
```json
{
  "url": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "type": "video",
    "metadata": {
      "domain": "example.com",
      "extension": "mp4",
      "isVideo": true
    }
  }
}
```

## Users API

### Get Current User
**GET** `/users/me`

**Headers:** `x-user-id` (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "role": "Admin|Editor|Viewer",
    "createdAt": "datetime"
  }
}
```

### Create User
**POST** `/users`

**Headers:** `x-user-id` (required)
**Permissions:** Admin only

**Request Body:**
```json
{
  "name": "string (required, 1-100 chars)",
  "email": "string (required, valid email)",
  "role": "Admin|Editor|Viewer (required)"
}
```

### Get User Permissions
**GET** `/users/:id/permissions`

**Headers:** `x-user-id` (required)
**Permissions:** Admin only

**Response:**
```json
{
  "success": true,
  "data": {
    "role": "Editor",
    "permissions": ["create", "read", "update"],
    "canCreateTopics": true,
    "canUpdateTopics": true,
    "canDeleteTopics": false,
    "canManageUsers": false
  }
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Validation failed for field 'name': Topic name is required"
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "error": "UnauthorizedError",
  "message": "User ID header is required"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "error": "ForbiddenError",
  "message": "Permission 'delete' required"
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "NotFoundError",
  "message": "Topic with ID 'uuid' not found"
}
```

### Conflict (409)
```json
{
  "success": false,
  "error": "ConflictError",
  "message": "Cannot set parent: would create circular reference"
}
```

## Rate Limiting

The API implements rate limiting:
- **General**: 100 requests per 15 minutes per IP
- **Admin**: 1000 requests per minute
- **Editor**: 500 requests per minute
- **Viewer**: 100 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1234567890
```

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `limit`: number (1-100, default: 20)
- `offset`: number (min: 0, default: 0)

**Response includes pagination info:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150
  }
}
```

## Status Codes

- **200**: OK - Request successful
- **201**: Created - Resource created successfully
- **400**: Bad Request - Invalid input data
- **401**: Unauthorized - Authentication required
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource not found
- **409**: Conflict - Resource conflict
- **422**: Unprocessable Entity - Business logic error
- **429**: Too Many Requests - Rate limit exceeded
- **500**: Internal Server Error - Server error
- **503**: Service Unavailable - Service temporarily unavailable
