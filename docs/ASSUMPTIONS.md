# Design Decisions & Assumptions

## Overview

This document outlines the key design decisions made during the development of Pulse Video and the assumptions that guided the implementation.

---

## Architectural Decisions

### 1. Monolithic Backend Architecture

**Decision**: Single Express.js server handling all functionality

**Rationale**:
- Simplifies deployment and maintenance
- Appropriate for the project scope
- Easier debugging and tracing
- Reduces operational complexity

**Trade-offs**:
- Less scalable than microservices
- All components share the same process

---

### 2. Local File Storage

**Decision**: Store uploaded videos in the local `uploads/` directory

**Rationale**:
- Simplifies initial development
- No external service dependencies
- Works well for demonstration purposes

**Assumptions**:
- Disk space is sufficient for demo usage
- Application runs on a single server

**Future Consideration**: Migrate to AWS S3 or similar for production

---

### 3. JWT for Authentication

**Decision**: Use JSON Web Tokens for stateless authentication

**Rationale**:
- Stateless = easily scalable
- No session storage required
- Includes user role for RBAC

**Configuration**:
- 7-day token expiration
- HMAC-SHA256 signing algorithm
- User ID and role embedded in payload

---

### 4. Socket.io for Real-Time Updates

**Decision**: WebSocket connection for processing progress

**Rationale**:
- Bidirectional communication
- Efficient for frequent updates
- Fallback support for older browsers

**Implementation**:
- User joins private room on login
- Server emits progress events during video processing
- Client updates UI in real-time

---

## Data Model Decisions

### 5. User-Video Relationship

**Decision**: One-to-many relationship (User → Videos)

**Rationale**:
- Simple ownership model
- Each video has exactly one owner
- Easy to query user's videos

**Schema**:
```javascript
Video: {
  owner: { type: ObjectId, ref: 'User' }
}
```

---

### 6. Video Status States

**Decision**: Three-state status model

**States**:
- `processing` - Upload complete, analysis in progress
- `completed` - Analysis finished successfully
- `failed` - Analysis encountered an error

**Rationale**: Clear, finite states simplify frontend logic

---

### 7. Sensitivity Classification

**Decision**: Binary classification (safe/flagged) with confidence score

**Rationale**:
- Simple for users to understand
- Numeric score allows for threshold adjustment
- Easy filtering in library view

**Implementation**:
- Classification: `'safe'` or `'flagged'`
- Score: 0.0 (safe) to 1.0 (highly sensitive)
- Threshold: 0.5 (configurable)

---

## Security Decisions

### 8. Password Hashing

**Decision**: bcrypt with 10 salt rounds

**Rationale**:
- Industry standard
- Automatic salting
- Configurable work factor

---

### 9. Role-Based Access Control

**Decision**: Three-tier role system

**Roles**:
| Role | Description |
|------|-------------|
| viewer | Read-only access to assigned content |
| editor | Full CRUD on own content (default) |
| admin | System-wide access |

**Rationale**:
- Covers common use cases
- Simple to understand
- Easy to extend

---

### 10. Default User Role

**Decision**: New users receive `editor` role

**Rationale**:
- Allows immediate content creation
- Better user experience
- Admin can downgrade if needed

---

## Frontend Decisions

### 11. React Context for State

**Decision**: Use React Context API instead of Redux

**Rationale**:
- Simpler setup for this project scope
- Two contexts (Auth, Socket) are manageable
- Reduces bundle size vs Redux

---

### 12. CSS Modules Approach

**Decision**: Component-scoped CSS files

**Rationale**:
- Avoids global namespace conflicts
- Co-located with components
- No build tool dependencies

---

### 13. Vite as Build Tool

**Decision**: Use Vite instead of Create React App

**Rationale**:
- Faster development server
- Smaller production bundles
- Modern ES module support

---

## Processing Decisions

### 14. Simulated Sensitivity Analysis

**Decision**: Mock implementation for content analysis

**Assumption**: Real ML-based analysis is out of scope

**Implementation**:
- Random classification for demo purposes
- Configurable processing delay
- Realistic progress updates

**Future**: Integrate actual content moderation API (AWS Rekognition, Google Vision, etc.)

---

### 15. FFmpeg Integration

**Decision**: Use FFmpeg via fluent-ffmpeg wrapper

**Usage**:
- Video validation
- Metadata extraction
- (Future) Thumbnail generation

**Assumption**: FFmpeg is installed on deployment server

---

## API Decisions

### 16. RESTful Design

**Decision**: Follow REST conventions

**Patterns**:
- `GET /api/videos` - List resources
- `GET /api/videos/:id` - Get single resource
- `POST /api/videos/upload` - Create resource
- `PUT /api/videos/:id` - Update resource
- `DELETE /api/videos/:id` - Remove resource

---

### 17. Response Format

**Decision**: Consistent JSON response structure

**Success**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error**:
```json
{
  "success": false,
  "message": "Error description"
}
```

---

### 18. Video Streaming

**Decision**: Support HTTP Range Requests

**Rationale**:
- Required for video seeking
- Standard browser expectation
- Bandwidth efficient

---

## Deployment Assumptions

### 19. Environment

- **Backend**: Node.js v18+ on Render/Heroku
- **Frontend**: Static hosting on Vercel
- **Database**: MongoDB Atlas (cloud)

### 20. Configuration

- Environment variables for all secrets
- Separate configs for development/production
- CORS configured for specific origins

---

## Known Limitations

1. **Single Server**: No horizontal scaling without file storage migration
2. **No Video Transcoding**: Videos served in original format
3. **Mock Analysis**: Sensitivity detection is simulated
4. **No Email Verification**: Users can register with any email
5. **Basic Error Handling**: Some edge cases may not be covered

---

## Future Enhancements

1. **Cloud Storage**: Migrate to S3 for scalability
2. **Real Content Analysis**: Integrate ML-based moderation
3. **Video Transcoding**: Support multiple quality levels
4. **Email Notifications**: Processing completion alerts
5. **Audit Logging**: Track user actions
6. **Rate Limiting**: Prevent API abuse
7. **Caching**: Redis for frequently accessed data
