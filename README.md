# Pulse Video

A comprehensive full-stack application for video upload, content sensitivity analysis, and streaming with real-time progress tracking.

## 🚀 Features

- **Video Upload & Management** - Upload videos with metadata handling
- **Content Sensitivity Analysis** - Automated content screening (safe/flagged classification)
- **Real-Time Updates** - Live processing progress via Socket.io
- **Video Streaming** - HTTP range request support for seamless playback
- **Multi-Tenant Architecture** - User isolation and data segregation
- **Role-Based Access Control** - Viewer, Editor, and Admin roles

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-Time**: Socket.io
- **Authentication**: JWT
- **File Handling**: Multer
- **Video Processing**: FFmpeg

### Frontend
- **Build Tool**: Vite
- **Framework**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Real-Time**: Socket.io Client

## 📁 Project Structure

```
Pulse1/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth & RBAC middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic (sensitivity analysis)
│   ├── utils/           # Helper utilities
│   ├── validators/      # Input validators
│   ├── tests/           # Test files
│   └── uploads/         # Video storage
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React Context (Auth, Socket)
│   │   ├── hooks/       # Custom React hooks
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service layer
│   │   ├── utils/       # Utility functions
│   │   └── constants/   # App constants
│   └── public/          # Static assets
└── docs/                # Documentation
```

## ⚙️ Installation

### Prerequisites
- Node.js (v18 or later)
- MongoDB (local or Atlas)
- FFmpeg (for video processing)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pulse-video
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
MAX_FILE_SIZE=104857600
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |

### Videos
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/videos/upload` | Upload video |
| GET | `/api/videos` | List user's videos |
| GET | `/api/videos/:id` | Get video details |
| GET | `/api/videos/:id/stream` | Stream video |
| PUT | `/api/videos/:id` | Update video |
| DELETE | `/api/videos/:id` | Delete video |

### Users (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| PUT | `/api/users/:id/role` | Update user role |
| DELETE | `/api/users/:id` | Delete user |

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **Viewer** | View assigned videos only |
| **Editor** | Upload, edit, delete own videos |
| **Admin** | Full system access + user management |

## 🎬 Workflow

1. **Register/Login** - Create account or sign in
2. **Upload Video** - Select file, add title & description
3. **Processing** - Real-time progress updates during analysis
4. **Review** - View classification (safe/flagged)
5. **Stream** - Watch processed videos
6. **Manage** - Edit or delete your content

## 🧪 Testing

```bash
cd backend
npm test
```

## 🚀 Deployment

### Backend (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set environment variables
4. Deploy

### Frontend (Vercel)
1. Import project to Vercel
2. Set `VITE_API_URL` to your backend URL
3. Deploy

## 📚 Documentation

- [API Documentation](docs/API.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [User Manual](docs/USER_MANUAL.md)
- [Design Decisions](docs/ASSUMPTIONS.md)

## 📄 License

MIT License
