# Dynamic Knowledge Base System

A comprehensive RESTful API for managing interconnected topics and resources with advanced features including version control, hierarchical structures, user role-based permissions, and custom algorithms for topic relationship analysis.

## Features

### Core Functionality
- **Topic Management**: Create, read, update, and delete topics with full version control
- **Hierarchical Structure**: Support for parent-child topic relationships with unlimited depth
- **Resource Management**: Associate external resources (videos, articles, PDFs, links, images) with topics
- **Version Control**: Complete versioning system for topics with ability to revert to previous versions
- **User Management**: Role-based access control with Admin, Editor, and Viewer roles

### Advanced Features
- **Recursive Topic Retrieval**: Get complete topic hierarchies with all subtopics and resources
- **Custom Shortest Path Algorithm**: Find the shortest path between any two topics in the hierarchy
- **Search Functionality**: Full-text search across topics and resources
- **Permission Strategy Pattern**: Flexible role-based permission system
- **Composite Pattern**: Hierarchical topic structure management
- **Factory Pattern**: Entity creation with type-specific factories

### Technical Excellence
- **TypeScript**: Full type safety and modern JavaScript features
- **Design Patterns**: Implementation of Factory, Strategy, and Composite patterns
- **SOLID Principles**: Clean architecture with proper separation of concerns
- **Comprehensive Testing**: Unit and integration tests with high coverage
- **Error Handling**: Robust error handling with custom error types
- **Data Validation**: Input validation using Joi schemas
- **File-based Database**: JSON-based persistence with transaction support

## Requirements

- Node.js 20.12.2+ (recommended)
- npm or yarn
- TypeScript 5.0+
- jq (for testing scripts)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dynamic-knowledge-base-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Switch to the correct Node.js version**
   ```bash
   nvm use v20.12.2
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Or use the provided startup script:
   ```bash
   ./start-server.sh
   ```

   Or start the production server:
   ```bash
   npm start
   ```

The API will be available at `http://localhost:3000`

### Quick Health Check
```bash
curl http://localhost:3000/api/health
```

## Project Structure

```
src/
├── algorithms/          # Custom algorithms (shortest path)
├── controllers/         # HTTP request handlers
├── database/           # Database layer and management
├── middleware/         # Authentication, validation, error handling
├── models/             # Entity models with business logic
├── patterns/           # Design pattern implementations
│   ├── composite/      # Composite pattern for hierarchies
│   ├── factory/        # Factory patterns for entity creation
│   └── strategy/       # Strategy pattern for permissions
├── routes/             # API route definitions
├── services/           # Business logic layer
├── tests/              # Unit and integration tests
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and validation
└── index.ts            # Application entry point
```

## Testing

The project includes comprehensive testing scripts to validate all functionality.

### Quick Test
Run a basic smoke test to verify core functionality:

```bash
./quick-test.sh
```

This script tests:
- Server health check
- User registration and login
- Basic topic and resource operations
- Statistics endpoints

### Comprehensive Test Suite
Run the complete test suite (38 tests covering all features):

```bash
./test-api.sh
```

This comprehensive test covers:
- User registration, login, and role-based permissions
- Topic CRUD operations and validation
- Hierarchical topic relationships
- Resource management and search
- Shortest path algorithm
- Topic versioning and revert functionality
- Error handling and edge cases
- Statistics and bulk operations
- Data cleanup operations

### Test Output
- **PASS**: Test passed successfully
- **FAIL**: Test failed with expected vs actual results
- **INFO**: Informational messages during testing

### Prerequisites for Testing
1. Ensure the server is running (`npm run dev`)
2. Install `jq` for JSON parsing: `sudo apt install jq` (Ubuntu/Debian) or `brew install jq` (macOS)

## Authentication

The API uses a simple header-based authentication system for demonstration purposes. In a production environment, you would implement JWT tokens or session-based authentication.

**Headers Required:**
```
x-user-id: <user-id>
```

**Default Admin User:**
- ID: `admin-default`
- Name: `System Administrator`
- Email: `admin@system.local`
- Role: `Admin`

## 👥 User Roles

### Admin
- Full access to all resources
- Can manage users (create, update, delete)
- Can perform all CRUD operations
- Access to system statistics and maintenance functions

### Editor
- Can create, read, and update topics and resources
- Cannot delete topics or manage users
- Can modify topic hierarchies
- Can create new versions of topics

### Viewer
- Read-only access to topics and resources
- Can search and view topic hierarchies
- Cannot modify any data
- Can view topic versions

## API Endpoints

### User Management
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - User login
- `GET /api/users` - List all users (Admin only)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile

### Topic Management
- `GET /api/topics` - Get all topics with pagination
- `POST /api/topics` - Create a new topic
- `GET /api/topics/:id` - Get topic by ID
- `PUT /api/topics/:id` - Update topic (creates new version)
- `DELETE /api/topics/:id` - Delete topic
- `GET /api/topics/root` - Get root topics
- `GET /api/topics/:id/hierarchy` - Get topic hierarchy
- `GET /api/topics/:id/children` - Get topic children
- `GET /api/topics/:id/recursive` - Get complete topic tree
- `GET /api/topics/search` - Search topics
- `GET /api/topics/stats` - Get topic statistics

### Topic Versioning
- `GET /api/topics/:id/versions` - Get all versions of a topic
- `GET /api/topics/:id/versions/:version` - Get specific version
- `POST /api/topics/:id/revert/:version` - Revert to specific version

### Topic Relationships
- `GET /api/topics/path` - Find shortest path between topics
- `POST /api/topics/find-path` - Alternative path finding endpoint
- `PUT /api/topics/:id/move` - Move topic in hierarchy

### Resource Management
- `GET /api/resources` - Get all resources
- `POST /api/resources` - Create a new resource
- `GET /api/resources/:id` - Get resource by ID
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource
- `GET /api/resources/topic/:topicId` - Get resources by topic
- `GET /api/resources/search` - Search resources
- `POST /api/resources/video` - Create video resource
- `POST /api/resources/validate-url` - Validate resource URL
- `GET /api/resources/stats` - Get resource statistics

### Bulk Operations
- `POST /api/resources/bulk` - Create multiple resources
- `POST /api/resources/cleanup-orphaned` - Remove orphaned resources
- `GET /api/resources/duplicates` - Find duplicate resources

### System
- `GET /api/health` - Health check endpoint
- `GET /api/info` - API information

## Usage Examples

### User Registration and Login

```bash
# Register a new user
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword",
    "role": "Editor"
  }'

# Login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword"
  }'
```

### Topic Operations

```bash
# Create a topic
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -H "x-user-id: your-user-id" \
  -d '{
    "name": "JavaScript Fundamentals",
    "content": "Core concepts of JavaScript programming"
  }'

# Update a topic (creates new version)
curl -X PUT http://localhost:3000/api/topics/topic-id \
  -H "Content-Type: application/json" \
  -H "x-user-id: your-user-id" \
  -d '{
    "name": "JavaScript Fundamentals - Updated",
    "content": "Updated content with new examples"
  }'

# Get topic hierarchy
curl -H "x-user-id: your-user-id" \
  http://localhost:3000/api/topics/topic-id/hierarchy

# Find shortest path between topics
curl -H "x-user-id: your-user-id" \
  "http://localhost:3000/api/topics/path?startTopicId=id1&endTopicId=id2"
```

### Resource Management

```bash
# Create a resource
curl -X POST http://localhost:3000/api/resources \
  -H "Content-Type: application/json" \
  -H "x-user-id: your-user-id" \
  -d '{
    "topicId": "topic-id",
    "url": "https://example.com/tutorial",
    "description": "Comprehensive JavaScript tutorial",
    "type": "article"
  }'

# Search resources
curl -H "x-user-id: your-user-id" \
  "http://localhost:3000/api/resources/search?q=javascript"
```

## Development

### Running Tests
```bash
# Unit tests
npm test

# Test with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npx tsc --noEmit
```

### Database

The system uses a file-based JSON database stored in the `data/` directory:
- `topics.json` - Topic data
- `topic_versions.json` - Topic version history
- `resources.json` - Resource data
- `users.json` - User data

### Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Validation failed: Topic name is required"
}
```

Common error types:
- `ValidationError` (400) - Invalid input data
- `UnauthorizedError` (401) - Authentication required
- `ForbiddenError` (403) - Insufficient permissions
- `NotFoundError` (404) - Resource not found
- `ConflictError` (409) - Resource already exists
- `InternalServerError` (500) - Server error