# 🚀 Express + MongoDB Authentication Migration Complete

Your application has been successfully migrated from Firebase to Express.js with MongoDB authentication.

## ✅ What's Been Changed

### Backend Changes
- ✅ **Express Server**: New server in `/server/` directory
- ✅ **MongoDB Integration**: User model and database connection
- ✅ **JWT Authentication**: Secure token-based authentication
- ✅ **Password Hashing**: bcryptjs with 12 salt rounds

- ✅ **Security Headers**: Helmet middleware for security
- ✅ **Authentication Routes**: `/api/auth/*` endpoints

### Frontend Changes
- ✅ **Google OAuth**: Direct Google Identity Services integration
- ✅ **Email Authentication**: Direct backend authentication
- ✅ **AuthContext**: Updated to use Express backend
- ✅ **API Client**: Updated to use new endpoints
- ✅ **Auth Modal**: Updated to handle new authentication flow

### Removed Firebase Dependencies
- ✅ `firebase` package removed
- ✅ `firebase-admin` removed
- ✅ Firebase configuration files deleted
- ✅ Firebase authentication logic replaced

## 🏗 New Architecture

```
Frontend (React)
├── Google OAuth (Google Identity Services)
├── Email/Password Forms
├── AuthContext (React Context)
└── API Client (fetch with JWT)
         ↓
Backend (Express)
├── Authentication Routes (/api/auth/*)
├── JWT Token Management
├── Password Hashing (bcryptjs)

└── MongoDB User Storage
         ↓
Database (MongoDB)
└── Users Collection
    ├── email (unique)
    ├── password (hashed)
    ├── displayName
    ├── photoURL
    ├── provider (email|google)
    ├── googleId (for Google users)
    └── timestamps
```

## 🚀 Quick Start

### 1. Install Dependencies (Already Done)
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the root directory:
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

# Google OAuth (Optional)
VITE_GOOGLE_CLIENT_ID=your-google-client-id-from-console

# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
```

### 3. Start MongoDB
```bash
# Option 1: Local MongoDB
mongod

# Option 2: Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Start the Application
```bash
# Start both frontend and backend
npm run dev:full

# Or start separately:
npm run dev:server  # Backend only
npm run dev         # Frontend only
```

## 🔐 Authentication Features

### Email/Password Authentication
- ✅ User registration with email validation
- ✅ Password strength validation
- ✅ Secure password hashing
- ✅ Login with email/password
- ✅ JWT token generation and validation

### Google OAuth Authentication  
- ✅ Google Sign-In integration
- ✅ User profile from Google
- ✅ Account linking (Google + email)
- ✅ Profile photo from Google

### Security Features

- ✅ CORS protection
- ✅ Security headers (Helmet)
- ✅ JWT token expiration
- ✅ Input validation and sanitization

## 🌐 API Endpoints

### Authentication (`/api/auth/`)
- `POST /register` - Email/password registration
- `POST /login` - Email/password login
- `POST /google` - Google OAuth authentication
- `GET /profile` - Get current user (requires JWT)
- `POST /logout` - Logout

### Example Requests

#### Register
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","displayName":"John Doe"}'
```

#### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

#### Get Profile
```bash
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🧪 Testing the Migration

### 1. Test Email Authentication
1. Open the app: http://localhost:5173
2. Click "新規登録" (Register)
3. Fill in email, password, and name
4. Click register - should create account and log in
5. Refresh page - should remain logged in
6. Logout and login with same credentials

### 2. Test Google Authentication (Optional)
1. Set up Google OAuth (see AUTHENTICATION_SETUP.md)
2. Click "Googleでログイン"
3. Complete Google OAuth flow
4. Should log in and get user profile

### 3. Test API Directly
```bash
# Health check
curl http://localhost:3001/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","displayName":"Test User"}'
```

## 🚨 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Using Docker
docker ps | grep mongo
docker start mongodb
```

### Port Already in Use
```bash
# Kill process using port 3001
sudo lsof -ti:3001 | xargs kill -9
```

### Google OAuth Not Working
- Verify `VITE_GOOGLE_CLIENT_ID` is set
- Check authorized domains in Google Cloud Console
- Google OAuth is optional - email auth will always work

## 📝 Next Steps

### For Production Deployment
1. **Change JWT Secret**: Use a secure random string
2. **Set up MongoDB**: Use MongoDB Atlas or secure instance
3. **Configure CORS**: Set specific frontend URL
4. **Set up HTTPS**: Use SSL certificates
5. **Environment Variables**: Use secure environment management

### Optional Enhancements
1. **Email Verification**: Add email verification flow
2. **Password Reset**: Add forgot password functionality
3. **Social Logins**: Add Facebook, Twitter, etc.
4. **Two-Factor Auth**: Add 2FA support
5. **Session Management**: Add refresh tokens

## 📚 Documentation

- **Full Setup Guide**: `AUTHENTICATION_SETUP.md`
- **Server Code**: `/server/` directory
- **Frontend Auth**: `/lib/auth.ts` and `/contexts/AuthContext.tsx`

Your Firebase to Express migration is complete! 🎉