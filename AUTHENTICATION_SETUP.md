# 🔐 Express + MongoDB Authentication Setup

This application uses Express.js with MongoDB for authentication instead of Firebase. It supports both Google OAuth and email/password authentication.

## 🏗 Architecture

### Backend (Express + MongoDB)
- **Express.js** server with JWT authentication
- **MongoDB** database for user storage
- **bcryptjs** for password hashing

- **Helmet** for security headers

### Frontend (React + Google OAuth)
- **Google Identity Services** for OAuth
- **JWT tokens** for API authentication
- **Local storage** for auth persistence
- **React Context** for state management

## 📦 Dependencies

### Backend Dependencies
```json
{
  "bcryptjs": "^2.4.3",
  "express": "^4.18.2",

  "helmet": "^7.1.0",
  "jsonwebtoken": "^9.0.2",
  "mongoose": "^8.0.3",
  "morgan": "^1.10.0"
}
```

### TypeScript Types
```json
{
  "@types/bcryptjs": "^2.4.6",
  "@types/express": "^4.17.21",
  "@types/jsonwebtoken": "^9.0.5",
  "@types/mongoose": "^5.11.97",
  "@types/morgan": "^1.9.9"
}
```

## 🔧 Environment Variables

Create a `.env` file in the frontend directory:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/health-app

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Google OAuth (frontend)
VITE_GOOGLE_CLIENT_ID=your-google-client-id-from-console
VITE_API_BASE_URL=http://localhost:3001/api
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up MongoDB
Make sure MongoDB is running:
```bash
# Using MongoDB Community Edition
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 3. Configure Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable **Google Identity** API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Set **Authorized JavaScript origins**:
   - `http://localhost:5173` (development)
   - Your production domain
6. Copy the **Client ID** to `VITE_GOOGLE_CLIENT_ID`

### 4. Start the Application

#### Development (Full Stack)
```bash
npm run dev:full
```

#### Start Server Only
```bash
npm run dev:server
```

#### Start Frontend Only
```bash
npm run dev
```

## 🔐 Authentication Flow

### Email/Password Authentication
1. User enters email and password
2. Frontend validates input
3. Backend verifies credentials and creates JWT
4. JWT stored in localStorage and sent with API requests

### Google OAuth Authentication
1. User clicks "Sign in with Google"
2. Google OAuth popup appears
3. User grants permission
4. Frontend receives Google user data
5. Frontend sends Google data to backend
6. Backend creates/finds user and returns JWT
7. JWT stored in localStorage

## 🌐 API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /register` - Email/password registration
- `POST /login` - Email/password login  
- `POST /google` - Google OAuth authentication
- `GET /profile` - Get current user profile (requires auth)
- `POST /logout` - Logout (requires auth)

### Request/Response Examples

#### Email Registration
```javascript
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe"
}

Response:
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "displayName": "John Doe",
    "provider": "email",
    "isEmailVerified": false
  },
  "isNewUser": true
}
```

#### Google Authentication
```javascript
POST /api/auth/google
{
  "googleId": "google-user-id",
  "email": "user@gmail.com",
  "displayName": "John Doe",
  "photoURL": "https://..."
}

Response:
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@gmail.com",
    "displayName": "John Doe",
    "photoURL": "https://...",
    "provider": "google",
    "isEmailVerified": true
  },
  "isNewUser": false
}
```

## 🔒 Security Features

- **Password Hashing**: bcryptjs with 12 salt rounds

- **JWT Expiration**: 7 days default
- **Security Headers**: Helmet middleware
- **Input Validation**: Email and password validation
- **CORS Protection**: Configured for frontend domain

## 🧪 Testing

### Manual Testing

1. **Email Registration**: Create account with email/password
2. **Email Login**: Sign in with created credentials
3. **Google Login**: Sign in with Google (requires setup)
4. **JWT Persistence**: Refresh page, should remain logged in
5. **Logout**: Sign out, should clear authentication

### API Testing with curl

```bash
# Register new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","displayName":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get profile (replace TOKEN)
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🚨 Common Issues

### MongoDB Connection Failed
- Make sure MongoDB is running
- Check `MONGODB_URI` in environment variables
- For Docker: `docker ps` to verify container is running

### Google OAuth Not Working
- Verify `VITE_GOOGLE_CLIENT_ID` is set correctly
- Check authorized domains in Google Cloud Console
- Make sure you're accessing from authorized domain

### JWT Token Invalid
- Token might be expired (check `JWT_EXPIRES_IN`)
- Make sure `JWT_SECRET` is consistent
- Check browser localStorage for token

## 📝 Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (required for email auth),
  displayName: String (required),
  photoURL: String (optional),
  provider: "email" | "google",
  googleId: String (unique, sparse),
  isEmailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔄 Migration from Firebase

The authentication system has been completely migrated from Firebase to Express + MongoDB:

- ✅ Firebase Admin SDK removed
- ✅ Firebase client SDK removed
- ✅ Express authentication implemented
- ✅ MongoDB user storage implemented
- ✅ Google OAuth frontend implementation
- ✅ JWT token management
- ✅ Email/password authentication

Your existing Firebase project can be decommissioned if no longer needed.