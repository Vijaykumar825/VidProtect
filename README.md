# Pulse Video - Video Processing Platform

A comprehensive full-stack application for video upload, sensitivity processing, and streaming with real-time progress tracking.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![React](https://img.shields.io/badge/react-18.x-blue.svg)

## 🎬 Features

### Core Functionality
- **Video Upload** - Drag-and-drop video upload with progress tracking
- **Sensitivity Analysis** - Automated content screening and classification (safe/flagged)
- **Real-time Updates** - Live processing progress via Socket.io
- **Video Streaming** - HTTP range request support for seamless playback
- **Multi-tenant Architecture** - User isolation with role-based access control

### User Roles
| Role | Permissions |
|------|-------------|
| **Viewer** | View own videos, stream content |
| **Editor** | Upload, edit, delete own videos |
| **Admin** | Full system access, user management |

## 🛠 Technology Stack

### Backend
- Node.js + Express.js
- MongoDB with Mongoose ODM
- Socket.io for real-time communication
- JWT authentication
- Multer for file uploads

### Frontend
- React 18 with Vite
- React Router for navigation
- Socket.io-client
- Axios for API requests
- Modern CSS with CSS variables

## 📁 Project Structure

```
Pulse1/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   └── rbac.js            # Role-based access control
│   ├── models/
│   │   ├── User.js            # User schema
│   │   └── Video.js           # Video schema
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── videos.js          # Video CRUD + streaming
│   │   └── users.js           # Admin user management
│   ├── services/
│   │   └── sensitivityAnalysis.js  # Video processing
│   ├── uploads/               # Video storage
│   ├── server.js              # Express server
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   └── Layout/        # Header, Sidebar, Layout
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── SocketContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── VideoLibrary.jsx
    │   │   ├── VideoUpload.jsx
    │   │   ├── VideoDetail.jsx
    │   │   └── AdminUsers.jsx
    │   ├── services/
    │   │   └── api.js         # Axios configuration
    │   ├── styles/
    │   │   └── index.css      # Global styles
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB Atlas account (or local MongoDB)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Pulse1
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables**

   Backend `.env` is already configured with:
   ```env
   PORT=5000
   MONGODB_URI=<your-mongodb-uri>
   JWT_SECRET=<your-jwt-secret>
   JWT_EXPIRE=7d
   MAX_FILE_SIZE=100000000
   NODE_ENV=development
   ```

5. **Start the development servers**

   Backend (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```

   Frontend (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

6. **Open the application**
   
   Navigate to `http://localhost:5173` in your browser.

## 📖 API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Videos

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/videos` | List user's videos |
| GET | `/api/videos/:id` | Get video details |
| POST | `/api/videos/upload` | Upload video |
| PUT | `/api/videos/:id` | Update video |
| DELETE | `/api/videos/:id` | Delete video |
| GET | `/api/videos/:id/stream` | Stream video |
| GET | `/api/videos/stats/summary` | Get statistics |

### Users (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| PUT | `/api/users/:id/role` | Update user role |
| DELETE | `/api/users/:id` | Delete user |

## 🔌 Socket.io Events

### Client → Server
- `join` - Join user's room for targeted events
- `leave` - Leave user's room

### Server → Client
- `upload:progress` - Upload progress updates
- `processing:start` - Processing started
- `processing:progress` - Processing progress with stage info
- `processing:complete` - Processing finished with results
- `processing:error` - Processing failed

## 🎨 User Interface

### Dashboard
- Statistics overview (total videos, safe/flagged counts, storage used)
- Real-time processing status
- Recent video list

### Video Library
- Grid view of all videos
- Filter by status (safe, flagged, processing)
- Real-time progress indicators
- Delete functionality

### Video Upload
- Drag-and-drop file selection
- File validation (type, size)
- Upload progress bar
- Auto-title from filename

### Video Detail
- Video player with native controls
- Processing status display
- Sensitivity analysis results
- Edit title/description
- Delete video

### Admin Panel
- User management table
- Role modification
- User statistics
- Search and filter

## 🔐 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- File type validation
- File size limits
- CORS protection

## 📝 Design Decisions

1. **Simulated Sensitivity Analysis**: The sensitivity analysis is simulated for demonstration purposes. In production, integrate with actual content moderation APIs (Google Cloud Video Intelligence, AWS Rekognition, Azure Video Analyzer).

2. **Local File Storage**: Videos are stored locally in the `uploads` directory. For production, use cloud storage (AWS S3, Google Cloud Storage).

3. **Real-time Updates**: Socket.io provides instant feedback during video processing. Each user receives only their own processing events via room-based targeting.

4. **Progressive Video Loading**: HTTP range requests enable efficient video streaming and seeking without downloading the entire file.

## 🧪 Testing

### Manual Testing

1. **Registration/Login Flow**
   - Register a new user
   - Login with credentials
   - Verify JWT token storage

2. **Video Upload Flow**
   - Upload a video file
   - Observe real-time progress
   - View processing completion

3. **Video Streaming**
   - Navigate to video detail
   - Play video
   - Test seeking functionality

4. **RBAC Testing**
   - Create users with different roles
   - Verify permission restrictions

## 📦 Deployment

### Backend Deployment (Render/Railway/Heroku)

1. Set environment variables
2. Deploy from Git repository
3. Ensure MongoDB Atlas is configured

### Frontend Deployment (Vercel/Netlify)

1. Update `VITE_API_URL` to point to deployed backend
2. Deploy from Git repository
3. Configure SPA routing

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using Node.js, React, and MongoDB
