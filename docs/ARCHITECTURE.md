# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │   React Pages   │  │  Socket.io      │  │  Video Player               │ │
│  │   (Dashboard,   │  │  Client         │  │  (Range Request Support)    │ │
│  │   Upload, etc)  │  │                 │  │                             │ │
│  └────────┬────────┘  └────────┬────────┘  └──────────────┬──────────────┘ │
└───────────┼────────────────────┼───────────────────────────┼────────────────┘
            │                    │                           │
            │ HTTP/HTTPS         │ WebSocket                 │ HTTP Range
            │                    │                           │
┌───────────▼────────────────────▼───────────────────────────▼────────────────┐
│                           EXPRESS.JS SERVER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Auth       │  │   Video      │  │   User       │  │   Socket.io      │ │
│  │   Routes     │  │   Routes     │  │   Routes     │  │   Server         │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘ │
│         │                 │                 │                    │          │
│  ┌──────▼─────────────────▼─────────────────▼────────────────────┘          │
│  │                    MIDDLEWARE LAYER                                      │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
│  │  │  JWT Auth   │  │  RBAC       │  │  Multer     │                      │
│  │  │  Middleware │  │  Middleware │  │  (Upload)   │                      │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                      │
│  └──────────────────────────────────────────────────────────────────────────│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        SERVICES LAYER                                   ││
│  │  ┌─────────────────────────────────────────────────────────────────┐   ││
│  │  │                  Sensitivity Analysis Service                    │   ││
│  │  │  - Frame extraction (FFmpeg)                                     │   ││
│  │  │  - Content classification (safe/flagged)                         │   ││
│  │  │  - Real-time progress updates                                    │   ││
│  │  └─────────────────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         │                             │                             │
         ▼                             ▼                             ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│    MongoDB      │         │   File System   │         │     FFmpeg      │
│  ┌───────────┐  │         │   (Uploads)     │         │  (Processing)   │
│  │  Users    │  │         │                 │         │                 │
│  │  Videos   │  │         │  *.mp4, *.mov   │         │  - Thumbnails   │
│  │  Metadata │  │         │  *.avi, *.webm  │         │  - Validation   │
│  └───────────┘  │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

## Component Breakdown

### Frontend Components

```
src/
├── context/
│   ├── AuthContext.jsx      # Authentication state management
│   └── SocketContext.jsx    # WebSocket connection management
├── pages/
│   ├── Dashboard.jsx        # Main dashboard with stats
│   ├── VideoUpload.jsx      # File upload interface
│   ├── VideoLibrary.jsx     # Video listing with filters
│   ├── VideoDetail.jsx      # Single video view + player
│   ├── Login.jsx            # User authentication
│   ├── Register.jsx         # User registration
│   └── AdminUsers.jsx       # User management (admin)
├── components/Layout/
│   ├── Header.jsx           # Navigation header
│   ├── Sidebar.jsx          # Navigation sidebar
│   └── Layout.jsx           # Main layout wrapper
└── services/
    └── api.js               # Axios HTTP client
```

### Backend Components

```
backend/
├── config/
│   └── db.js               # MongoDB connection
├── middleware/
│   ├── auth.js             # JWT verification
│   └── rbac.js             # Role-based access control
├── models/
│   ├── User.js             # User schema
│   └── Video.js            # Video metadata schema
├── routes/
│   ├── auth.js             # Authentication endpoints
│   ├── videos.js           # Video CRUD + streaming
│   └── users.js            # User management
├── services/
│   └── sensitivityAnalysis.js  # Video processing
└── server.js               # Express app entry point
```

## Data Flow

### Video Upload Flow

```
1. User selects file → Frontend validates type/size
                            ↓
2. FormData sent → POST /api/videos/upload
                            ↓
3. Multer middleware → Saves file to /uploads
                            ↓
4. Video document created → Status: "processing"
                            ↓
5. Response sent to client → "Upload successful"
                            ↓
6. Background process starts → sensitivityAnalysis.js
                            ↓
7. Progress updates → Socket.io events to client
                            ↓
8. Analysis complete → Video status: "completed"
```

### Authentication Flow

```
1. User submits credentials
          ↓
2. Server validates password (bcrypt)
          ↓
3. JWT generated with user ID + role
          ↓
4. Token returned to client
          ↓
5. Client stores in localStorage
          ↓
6. Subsequent requests include Authorization header
          ↓
7. auth.js middleware verifies token
          ↓
8. rbac.js middleware checks permissions
```

## Multi-Tenant Design

### User Isolation

- Each user can only access their own videos
- Query filters automatically applied: `{ owner: req.user.id }`
- Admin users bypass isolation for management

### Data Model

```javascript
// User Schema
{
  username: String,
  email: String,
  password: String (hashed),
  role: 'viewer' | 'editor' | 'admin'
}

// Video Schema
{
  title: String,
  description: String,
  filename: String,
  mimetype: String,
  size: Number,
  status: 'processing' | 'completed' | 'failed',
  classification: 'safe' | 'flagged',
  sensitivityScore: Number,
  owner: ObjectId (ref: User),
  createdAt: Date,
  processedAt: Date
}
```

## Role-Based Access Control

| Role | Videos | Users | Admin Panel |
|------|--------|-------|-------------|
| Viewer | Read own | - | - |
| Editor | CRUD own | - | - |
| Admin | CRUD all | CRUD | ✓ |

## Security Measures

1. **Password Hashing** - bcrypt with salt rounds
2. **JWT Tokens** - Signed with secret, 7-day expiry
3. **Input Validation** - Express validator on all inputs
4. **File Type Validation** - MIME type checking
5. **CORS Configuration** - Whitelist allowed origins
6. **Owner Verification** - Users can only modify own resources

## Real-Time Updates

### Socket.io Events

```javascript
// Server sends during processing
io.to(userId).emit('processingProgress', {
  videoId: '...',
  progress: 45,
  stage: 'Analyzing frames'
});

io.to(userId).emit('processingComplete', {
  videoId: '...',
  classification: 'safe',
  sensitivityScore: 0.15
});
```

## Video Streaming

HTTP Range Request support enables:
- Seek functionality
- Progressive loading
- Bandwidth optimization

```javascript
// Range header: bytes=0-999999
// Response: 206 Partial Content
{
  'Content-Range': 'bytes 0-999999/5000000',
  'Accept-Ranges': 'bytes',
  'Content-Length': 1000000,
  'Content-Type': 'video/mp4'
}
```

## Scalability Considerations

1. **File Storage** - Can migrate to S3/Cloud Storage
2. **Database** - MongoDB Atlas supports clustering
3. **Processing** - Can offload to dedicated workers
4. **Caching** - Add Redis for session/video metadata
5. **CDN** - Integrate CloudFront for video delivery
