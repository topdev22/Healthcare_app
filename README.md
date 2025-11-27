# Health Buddy: Feature Overview

## 1. Authentication & Onboarding
- Supports Google OAuth and email/password sign-in.
- Presents a guided welcome flow for new users and maintains session-aware modals for auth/profile management.

## 2. Health Data Logging
- Captures daily metrics such as weight, mood, diet, water intake, exercise, and sleep.
- Provides guided dialogs/modals for recording entries with haptic feedback and mobile-friendly UI.
- Automatically saves relevant records when other subsystems (chat, food analysis) detect actionable insights.

## 3. AI Health Companion
- Offers conversational coaching through a friendly Japanese-language assistant.
- Remembers user profile, recent health logs, and sentiment to personalize responses.
- Assigns character animations and optional text-to-speech output for immersive interactions.
- Extracts structured health facts from each conversation to keep the dashboard in sync.

## 4. Food Image Analysis
- Allows users to capture or upload meal photos using desktop or mobile cameras.
- Works offline-friendly by falling back to local estimation when cloud image analysis is unavailable.
- Returns calorie estimates and detected ingredients so nutrition data can be saved with one tap.

## 5. Real-Time Dashboard & Stats
- Streams the latest health metrics (mood, weight, calories, water, steps, streaks) via WebSocket and polling fallbacks.
- Displays quick cards, progress bars, and live indicators to highlight daily achievements.
- Includes manual refresh and test simulation controls for demos or poor network conditions.

## 6. Character Growth & Motivation
- Visualizes a companion character whose mood, animations, and health level reflect the user’s habits.
- Awards experience points for logging, chatting, streaks, and achievements, unlocking higher levels and celebratory effects.
- Sends motivational messages tailored to the user’s current performance and streak history.

## 7. Achievements & Progress Tracking
- Ships with a catalog of milestone badges (streaks, logging counts, conversations, food photos, workouts).
- Continuously evaluates progress and marks achievements complete when requirements are met.
- Summarizes total experience, next-level progress, recent badges, and lifetime activity counts.

## 8. Step Counting & Activity Goals
- Integrates step tracking with sensor/permission handling for both iOS and Android contexts.
- Provides auto-start, manual control, and goal-based statistics (distance, calories, active time).
- Feeds step totals into the dashboard so movement goals sit alongside other wellness metrics.

## 9. Mobile-First Experience
- Uses responsive layouts, touch targets, and floating action buttons optimized for phones/tablets.
- Leverages Capacitor APIs for haptics, text-to-speech, and native-like behavior.
- Indicates plans for deeper PWA support while already offering cross-platform builds (Web, Android, iOS).

## 10. System Architecture Notes
- Frontend: React + TypeScript + Tailwind + shadcn UI components.
- Backend: Express API handling auth, chat, health logs, achievements, dashboards, and external AI services.
- Shared: Type definitions and utilities keep data consistent across client/server.

---
**Need deeper details on any feature (e.g., deployment, APIs, mobile packaging)? Let me know!**

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
