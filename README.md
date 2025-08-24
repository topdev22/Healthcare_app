# Health Buddy - Health Management Application

A comprehensive health management application with AI-powered chat assistance, built with React, TypeScript, and OpenAI GPT-4 integration. The application provides personalized health tracking, nutrition analysis, and AI-driven wellness advice.

## 🌟 Features

- **Authentication System**: Google OAuth, email/password authentication
- **Health Data Recording**: Weight, mood, diet, and exercise tracking
- **AI Chat Assistant**: GPT-4 powered health advice and support
- **Food Image Analysis**: Automatic calorie calculation from photos
- **Statistics Dashboard**: Detailed health data analysis and charts
- **Character Growth System**: Character development through consistent health logging
- **Mobile Responsive**: Cross-platform mobile application

## 📋 Prerequisites

- Node.js 18+ 
- Backend API server (separate setup required)

## 🛠️ Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Variables Setup**
```bash
cp .env.example .env
```

Edit the `.env` file and configure the following:
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

3. **Start Development Server**
```bash
npm run dev
```

The application will start at http://localhost:8080.

## 🏗️ Build

Production build:
```bash
npm run build
```

Built files will be output to the `dist` folder.

## 📡 Backend API Requirements

The frontend expects the following API endpoints:

### Authentication (`/auth`)
- `POST /auth/google` - Google OAuth authentication
- `POST /auth/login` - Email login
- `POST /auth/register` - User registration
- `POST /auth/logout` - Logout
- `GET /auth/me` - Current user information

### User (`/user`)
- `GET /user/profile` - Get profile
- `PUT /user/profile` - Update profile

### Health Data (`/health`)
- `GET /health/logs` - Health logs list
- `POST /health/logs` - Create health log
- `POST /health/analyze-food` - Food image analysis
- `POST /health/food` - Save food data

### Chat (`/chat`)
- `POST /chat/message` - GPT chat
- `GET /chat/history` - Chat history

### Statistics (`/stats`)
- `GET /stats/health` - Health statistics data

## 🎨 Technology Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **TailwindCSS** - Styling
- **Radix UI** - Accessible UI components
- **React Router** - Routing
- **React Query** - Server state management

## 📁 Project Structure

```
client/
├── components/          # Reusable components
│   ├── ui/             # Basic UI components (shadcn/ui)
│   ├── Character.tsx   # Character component
│   ├── ChatInterface.tsx
│   └── ...
├── contexts/           # React Context
│   └── AuthContext.tsx
├── lib/               # Utilities
│   ├── api.ts         # API communication functions
│   └── utils.ts
├── pages/             # Page components
│   ├── Index.tsx      # Main page
│   └── NotFound.tsx
├── App.tsx            # Application root
└── global.css         # Global styles
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend API base URL | Yes |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |

### Proxy Configuration

In development environment, Vite automatically proxies requests to `/api` to the backend server.

## 🚀 Deployment

### Netlify
1. Connect repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set environment variables

### Vercel
1. Import project
2. Framework preset: Vite
3. Set environment variables

## 📱 Mobile Support

- Responsive design
- Touch-friendly UI
- Mobile-optimized font sizes
- PWA support (planned for future implementation)

## 🧪 Testing

```bash
npm test
```

## 📄 License

MIT License
