# API Examples for Postman

This document provides sample requests and responses for the Project Management API endpoints.

## Authentication

### Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@example.com",
      "role": {
        "id": 1,
        "name": "Founder"
      }
    }
  },
  "message": "Login successful"
}
```

## Projects

### Create Project
**POST** `/api/projects`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "E-commerce Platform",
  "description": "Building a modern e-commerce platform with React and Node.js",
  "clientName": "TechCorp Inc",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-06-30T23:59:59.000Z",
  "status": "active",
  "budget": 50000,
  "currency": "INR"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "E-commerce Platform",
    "description": "Building a modern e-commerce platform with React and Node.js",
    "clientName": "TechCorp Inc",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-06-30T23:59:59.000Z",
    "status": "active",
    "budget": 50000,
    "currency": "INR",
    "createdById": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "createdBy": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "_count": {
      "modules": 0,
      "tasks": 0
    }
  },
  "message": "Project created successfully"
}
```

### Get Projects
**GET** `/api/projects?page=1&limit=10&status=active&search=ecommerce`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "E-commerce Platform",
      "description": "Building a modern e-commerce platform with React and Node.js",
      "clientName": "TechCorp Inc",
      "status": "active",
      "budget": 50000,
      "currency": "INR",
      "createdBy": {
        "id": 1,
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "_count": {
        "modules": 2,
        "tasks": 5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

## Modules

### Create Module
**POST** `/api/modules/projects/1/modules`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "User Authentication",
  "description": "Implement user login, registration, and password reset functionality",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-15T23:59:59.000Z",
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "User Authentication",
    "description": "Implement user login, registration, and password reset functionality",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-15T23:59:59.000Z",
    "status": "active",
    "projectId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "project": {
      "id": 1,
      "name": "E-commerce Platform"
    },
    "_count": {
      "tasks": 0
    }
  },
  "message": "Module created successfully"
}
```

## Tasks

### Create Task
**POST** `/api/tasks`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Implement JWT Authentication",
  "description": "Create JWT-based authentication system with access and refresh tokens",
  "moduleId": 1,
  "estimateHours": 16,
  "priority": "high",
  "dueDate": "2024-01-10T23:59:59.000Z",
  "status": "todo"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Implement JWT Authentication",
    "description": "Create JWT-based authentication system with access and refresh tokens",
    "moduleId": 1,
    "estimateHours": 16,
    "priority": "high",
    "dueDate": "2024-01-10T23:59:59.000Z",
    "status": "todo",
    "createdById": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "createdBy": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "module": {
      "id": 1,
      "name": "User Authentication",
      "project": {
        "id": 1,
        "name": "E-commerce Platform"
      }
    },
    "assignedTo": [],
    "_count": {
      "comments": 0,
      "files": 0,
      "timeEntries": 0
    }
  },
  "message": "Task created successfully"
}
```

### Assign Task
**POST** `/api/tasks/1/assign`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userIds": [2, 3]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Implement JWT Authentication",
    "assignedTo": [
      {
        "id": 2,
        "name": "John Developer",
        "email": "john@example.com"
      },
      {
        "id": 3,
        "name": "Jane Developer",
        "email": "jane@example.com"
      }
    ]
  },
  "message": "Task assigned successfully"
}
```

### Add Comment
**POST** `/api/tasks/1/comments`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Started working on the JWT implementation. Will need to set up the middleware first."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "content": "Started working on the JWT implementation. Will need to set up the middleware first.",
    "isSystem": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@example.com"
    }
  },
  "message": "Comment added successfully"
}
```

### Upload File
**POST** `/api/tasks/1/files`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
```
file: [Select file] (e.g., jwt-implementation.pdf)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "filename": "file-1640995200000-123456789.pdf",
    "originalName": "jwt-implementation.pdf",
    "mimeType": "application/pdf",
    "size": 1024000,
    "path": "/uploads/file-1640995200000-123456789.pdf",
    "taskId": 1,
    "uploadedById": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "uploadedBy": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@example.com"
    }
  },
  "message": "File uploaded successfully"
}
```

## Error Responses

### Validation Error
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "Title is required",
      "path": ["title"]
    }
  ]
}
```

### Unauthorized
```json
{
  "error": "Access token required"
}
```

### Not Found
```json
{
  "success": false,
  "error": "Task not found"
}
```

### Forbidden (Insufficient Role)
```json
{
  "error": "Insufficient permissions. Required roles: Founder, ProjectManager"
}
```

## Environment Variables for Postman

Create these variables in your Postman environment:

- `base_url`: `http://localhost:3001`
- `access_token`: (Set after login)
- `project_id`: (Set after creating a project)
- `module_id`: (Set after creating a module)
- `task_id`: (Set after creating a task)

## Collection Setup

1. Create a new collection in Postman
2. Add the environment variables above
3. Set up a pre-request script for authentication:

```javascript
// Add this to collection pre-request script
if (pm.environment.get("access_token")) {
    pm.request.headers.add({
        key: 'Authorization',
        value: 'Bearer ' + pm.environment.get("access_token")
    });
}
```

4. Create a login request and set the access token in environment:

```javascript
// Add this to login request test script
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("access_token", response.data.accessToken);
}
```
