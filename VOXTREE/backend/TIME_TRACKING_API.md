# Time Tracking API Documentation

## Overview
The Time Tracking API provides endpoints for tracking work time, managing time entries, and generating timesheet reports with billing calculations.

## Endpoints

### 1. Start Time Tracking

**Endpoint:** `POST /api/time-entries/start`
**Authorization:** Bearer Token
**Description:** Starts time tracking for a specific task

**Request Body:**
```json
{
  "taskId": 1
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "taskId": 1,
    "userId": 2,
    "startTime": "2025-10-02T01:00:00.000Z",
    "endTime": null,
    "durationMins": null,
    "notes": "Started time tracking",
    "task": {
      "id": 1,
      "title": "Implement User Authentication",
      "module": {
        "id": 1,
        "name": "Authentication Module",
        "project": {
          "id": 1,
          "name": "VOXTREE Development"
        }
      }
    },
    "user": {
      "id": 2,
      "name": "John Freelancer",
      "email": "freelancer@example.com"
    }
  },
  "message": "Time tracking started successfully"
}
```

**Error Responses:**
- `400` - Already have a running time entry
- `403` - Not authorized to track time for this task
- `404` - Task not found

### 2. Stop Time Tracking

**Endpoint:** `POST /api/time-entries/stop`
**Authorization:** Bearer Token
**Description:** Stops time tracking and calculates duration

**Request Body:**
```json
{
  "entryId": 1
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "taskId": 1,
    "userId": 2,
    "startTime": "2025-10-02T01:00:00.000Z",
    "endTime": "2025-10-02T03:30:00.000Z",
    "durationMins": 150,
    "notes": "Started time tracking",
    "billingAmount": 3000.0,
    "task": {
      "id": 1,
      "title": "Implement User Authentication"
    },
    "user": {
      "id": 2,
      "name": "John Freelancer",
      "email": "freelancer@example.com",
      "hourlyRate": 1200.0,
      "isFreelancer": true
    }
  },
  "message": "Time tracking stopped successfully"
}
```

### 3. Create Manual Time Entry

**Endpoint:** `POST /api/time-entries`
**Authorization:** Bearer Token
**Description:** Creates a manual time entry with specific start and end times

**Request Body:**
```json
{
  "taskId": 1,
  "startTime": "2025-10-02T09:00:00.000Z",
  "endTime": "2025-10-02T17:00:00.000Z",
  "notes": "Full day of development work"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "taskId": 1,
    "userId": 2,
    "startTime": "2025-10-02T09:00:00.000Z",
    "endTime": "2025-10-02T17:00:00.000Z",
    "durationMins": 480,
    "notes": "Full day of development work",
    "billingAmount": 9600.0,
    "task": {
      "id": 1,
      "title": "Implement User Authentication",
      "module": {
        "id": 1,
        "name": "Authentication Module",
        "project": {
          "id": 1,
          "name": "VOXTREE Development"
        }
      }
    },
    "user": {
      "id": 2,
      "name": "John Freelancer",
      "email": "freelancer@example.com",
      "hourlyRate": 1200.0,
      "isFreelancer": true
    }
  },
  "message": "Time entry created successfully",
  "warning": {
    "message": "Overlapping time entries detected",
    "overlappingEntries": [
      {
        "id": 1,
        "taskTitle": "Implement User Authentication",
        "startTime": "2025-10-02T01:00:00.000Z",
        "endTime": "2025-10-02T03:30:00.000Z"
      }
    ]
  }
}
```

### 4. Get User Time Entries

**Endpoint:** `GET /api/time-entries/users/:id/time-entries`
**Authorization:** Bearer Token
**Description:** Retrieves time entries for a specific user with optional filtering

**Query Parameters:**
- `projectId` (optional) - Filter by project ID
- `from` (optional) - Start date filter (ISO datetime)
- `to` (optional) - End date filter (ISO datetime)

**Example Request:**
```
GET /api/time-entries/users/2/time-entries?projectId=1&from=2025-10-01T00:00:00.000Z&to=2025-10-31T23:59:59.000Z
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "taskId": 1,
      "userId": 2,
      "startTime": "2025-10-02T01:00:00.000Z",
      "endTime": "2025-10-02T03:30:00.000Z",
      "durationMins": 150,
      "notes": "Started time tracking",
      "billingAmount": 3000.0,
      "task": {
        "id": 1,
        "title": "Implement User Authentication",
        "module": {
          "id": 1,
          "name": "Authentication Module",
          "project": {
            "id": 1,
            "name": "VOXTREE Development"
          }
        }
      },
      "user": {
        "id": 2,
        "name": "John Freelancer",
        "email": "freelancer@example.com",
        "hourlyRate": 1200.0,
        "isFreelancer": true
      }
    }
  ],
  "message": "Time entries retrieved successfully"
}
```

### 5. Get Project Timesheet

**Endpoint:** `GET /api/time-entries/projects/:id/timesheet`
**Authorization:** Bearer Token (Admin only)
**Description:** Retrieves aggregated timesheet data for a project

**Query Parameters:**
- `from` (optional) - Start date filter (ISO datetime)
- `to` (optional) - End date filter (ISO datetime)

**Example Request:**
```
GET /api/time-entries/projects/1/timesheet?from=2025-10-01T00:00:00.000Z&to=2025-10-31T23:59:59.000Z
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": 1,
      "name": "VOXTREE Development"
    },
    "timesheet": [
      {
        "user": {
          "id": 2,
          "name": "John Freelancer",
          "email": "freelancer@example.com",
          "hourlyRate": 1200.0,
          "isFreelancer": true
        },
        "totalMinutes": 630,
        "totalHours": 10.5,
        "totalAmount": 12600.0,
        "entryCount": 2,
        "entries": [
          {
            "id": 1,
            "taskTitle": "Implement User Authentication",
            "moduleName": "Authentication Module",
            "startTime": "2025-10-02T01:00:00.000Z",
            "endTime": "2025-10-02T03:30:00.000Z",
            "durationMins": 150,
            "notes": "Started time tracking"
          },
          {
            "id": 2,
            "taskTitle": "Implement User Authentication",
            "moduleName": "Authentication Module",
            "startTime": "2025-10-02T09:00:00.000Z",
            "endTime": "2025-10-02T17:00:00.000Z",
            "durationMins": 480,
            "notes": "Full day of development work"
          }
        ]
      }
    ],
    "summary": {
      "totalUsers": 1,
      "totalMinutes": 630,
      "totalAmount": 12600.0
    }
  },
  "message": "Project timesheet retrieved successfully"
}
```

## Business Rules

### Authorization
- Users can only track time for tasks they are assigned to
- Users can only view their own time entries (unless they are admins)
- Only admins (Founder, ProjectManager) can view project timesheets

### Time Tracking
- Only one running time entry per user at a time
- Manual entries can overlap (with warning)
- Freelancers have billing calculations based on hourly rate

### Billing
- Billing amount = (duration in minutes / 60) × hourly rate
- Only calculated for freelancers with hourly rates
- Amounts are rounded to 2 decimal places

## Error Codes

- `400` - Validation error or business rule violation
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found
- `500` - Internal server error

## Testing

Run the time tracking tests:
```bash
npm test -- --testPathPattern=timeEntries.test.ts
```

The tests cover:
- Start/stop time tracking flow
- Manual time entry creation
- Overlapping entry detection
- Authorization checks
- Billing calculations
- Timesheet aggregation
