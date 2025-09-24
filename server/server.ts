import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import healthRoutes, { setSocketIO as setHealthSocketIO } from './routes/health';
import chatRoutes from './routes/chat';
import dashboardRoutes from './routes/dashboard';
import achievementRoutes from './routes/achievements';
import characterRoutes from './routes/character';


const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow Socket.IO connections from Android WebView
      const allowedOrigins = [
        'https://hapiken.jp',
        'http://localhost:8080',
        'capacitor://localhost',
        'http://localhost',
        'https://care-delta-woad.vercel.app'
      ];
      
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('capacitor://')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all for now
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    // credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  // Additional configuration for mobile stability
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  allowUpgrades: true,
  // Allow both polling and websocket for Android compatibility
  transports: ['polling', 'websocket']
});
const PORT = process.env.PORT || 8000;

console.log('🔄 Starting server...');

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "http://localhost:8000", "ws://localhost:8000"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from Android WebView and various environments
    const allowedOrigins = [
      'https://hapiken.jp',
      'http://localhost:8080',
      'capacitor://localhost',
      'http://localhost',
      'https://care-delta-woad.vercel.app'
    ];
    
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('capacitor://')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Set-Cookie"]
}));
 
// Body parsing middleware with increased limits for file uploads (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false }));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Serve static files from public directory
app.use('/profile', express.static('server/public/profile'));
app.use('/public', express.static('public'));

// Serve manifest.json from root for proper CORS handling
app.get('/manifest.json', (req, res) => {
  res.sendFile('manifest.json', { root: 'public' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Inject Socket.IO instance into routes that need real-time capabilities
setHealthSocketIO(io);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/character', characterRoutes)

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  // Handle authentication
  socket.on('authenticate', (token) => {
    // TODO: Implement token verification
    console.log('🔐 Socket authentication attempt:', socket.id);
  });
  
  // Handle health data subscriptions
  socket.on('subscribe_health_updates', () => {
    socket.join('health_updates');
    console.log('📊 Client subscribed to health updates:', socket.id);
  });
  
  socket.on('unsubscribe_health_updates', () => {
    socket.leave('health_updates');
    console.log('📊 Client unsubscribed from health updates:', socket.id);
  });
  
  // Handle chat room management
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log('💬 Client joined room:', roomId, socket.id);
  });
  
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log('💬 Client left room:', roomId, socket.id);
  });
  
  // Handle chat messages
  socket.on('chat_message', (data) => {
    socket.to(data.roomId).emit('chat_message', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user_typing', {
      userId: socket.id,
      isTyping: data.isTyping
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO server ready`);
  // console.log(`📱 Health check: http://localhost:${PORT}/health`);
  // console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  // console.log(`👤 User API: http://localhost:${PORT}/api/user`);
  // console.log(`💊 Health API: http://localhost:${PORT}/api/health`);
  // console.log(`💬 Chat API: http://localhost:${PORT}/api/chat`);
  // console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard`);
  // console.log(`🏆 Achievements API: http://localhost:${PORT}/api/achievements`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});