# API Documentation

## Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://vidprotect.onrender.com/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### Register User

**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "editor"
    }
  }
}
```

---

### Login User

**POST** `/auth/login`

Authenticate an existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "editor"
    }
  }
}
```

---

### Get Current User

**GET** `/auth/me`

Get the authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "editor",
      "createdAt": "2024-01-10T08:00:00.000Z"
    }
  }
}
```

---

## Video Endpoints

### Upload Video

**POST** `/videos/upload`

Upload a new video file.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| video | File | Yes | Video file (mp4, mov, avi, mkv, webm) |
| title | String | Yes | Video title |
| description | String | No | Video description |

**Response (201):**
```json
{
  "success": true,
  "message": "Video uploaded successfully. Processing started.",
  "data": {
    "video": {
      "id": "507f1f77bcf86cd799439012",
      "title": "My Video",
      "status": "processing",
      "estimatedProcessingTime": "30 seconds"
    }
  }
}
```

---

### List Videos

**GET** `/videos`

Get list of user's videos with filtering and pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| status | String | - | Filter by status (processing, completed, failed) |
| classification | String | - | Filter by classification (safe, flagged) |
| page | Number | 1 | Page number |
| limit | Number | 10 | Items per page |
| sort | String | -createdAt | Sort field (prefix with - for descending) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "title": "My Video",
        "description": "A sample video",
        "filename": "abc123.mp4",
        "mimetype": "video/mp4",
        "size": 15728640,
        "status": "completed",
        "classification": "safe",
        "sensitivityScore": 0.15,
        "createdAt": "2024-01-10T08:00:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 50
    }
  }
}
```

---

### Get Single Video

**GET** `/videos/:id`

Get details of a specific video.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "video": {
      "_id": "507f1f77bcf86cd799439012",
      "title": "My Video",
      "description": "A sample video",
      "filename": "abc123.mp4",
      "mimetype": "video/mp4",
      "size": 15728640,
      "status": "completed",
      "classification": "safe",
      "sensitivityScore": 0.15,
      "owner": {
        "_id": "507f1f77bcf86cd799439011",
        "username": "john_doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-10T08:00:00.000Z",
      "processedAt": "2024-01-10T08:01:00.000Z"
    }
  }
}
```

---

### Stream Video

**GET** `/videos/:id/stream`

Stream video content with range request support.

**Headers:**
- `Authorization: Bearer <token>`
- `Range: bytes=0-` (optional, for partial content)

**Response (200 or 206):**
- Returns video binary stream
- Supports partial content (206) for seeking

---

### Update Video

**PUT** `/videos/:id`

Update video metadata.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Video updated successfully",
  "data": {
    "video": {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Updated Title",
      "description": "Updated description"
    }
  }
}
```

---

### Delete Video

**DELETE** `/videos/:id`

Delete a video and its file.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Video deleted successfully"
}
```

---

## User Management Endpoints (Admin Only)

### List All Users

**GET** `/users`

Get list of all users (admin only).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "username": "john_doe",
        "email": "john@example.com",
        "role": "editor",
        "createdAt": "2024-01-10T08:00:00.000Z"
      }
    ]
  }
}
```

---

### Update User Role

**PUT** `/users/:id/role`

Change a user's role (admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User role updated successfully"
}
```

---

### Delete User

**DELETE** `/users/:id`

Delete a user account (admin only).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Status Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Internal error |

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding for production use.

## WebSocket Events

### Client → Server
- `join` - Join user's private room: `socket.emit('join', userId)`
- `leave` - Leave room: `socket.emit('leave', userId)`

### Server → Client
- `processingProgress` - Video processing progress update
- `processingComplete` - Video processing finished
- `processingError` - Video processing failed
