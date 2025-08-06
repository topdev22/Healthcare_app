import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { io, Socket } from 'socket.io-client';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.statusText || 'Server error';
      if (error.response.status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
      }
      throw new Error(message);
    } else if (error.request) {
      // Network error
      throw new Error('Network error occurred. Please check your internet connection.');
    } else {
      // Other error
      throw new Error(error.message || 'An error occurred while processing the request.');
    }
  }
);

// Socket.io connection
class SocketManager {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(): Socket {
    if (!this.socket || !this.isConnected) {
      const token = localStorage.getItem('auth_token');
      
      this.socket = io(SOCKET_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('🔌 Socket connected:', this.socket?.id);
        this.isConnected = true;
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔌 Socket connection error:', error);
        this.isConnected = false;
      });
    }

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }
}

export const socketManager = new SocketManager();

// Authentication API
export const authAPI = {
  // Google Login - send Google user data to backend
  async signInWithGoogle(googleData: {
    googleId: string;
    email: string;
    displayName: string;
    photoURL?: string;
  }) {
    const response = await apiClient.post('/auth/google', googleData);
    return response.data;
  },

  // Email/Password Login
  async signInWithEmail(email: string, password: string) {
    console.log('signInWithEmail', email, password);
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  // Email Registration
  async signUpWithEmail(email: string, password: string, displayName: string) {
    const response = await apiClient.post('/auth/register', { 
      email, 
      password, 
      displayName 
    });
    return response.data;
  },

  // Logout
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.log('Backend logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      socketManager.disconnect();
    }
  },

  // Get current user info
  async getCurrentUser() {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  // Refresh token
  async refreshToken() {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  }
};

// User Profile API
export const userAPI = {
  // Get user profile
  async getProfile() {
    const response = await apiClient.get('/user/profile');
    return response.data;
  },

  // Update user profile
  async updateProfile(profileData: any) {
    const response = await apiClient.put('/user/profile', profileData);
    return response.data;
  },

  // Create user profile
  async createProfile(profileData: any) {
    const response = await apiClient.post('/user/profile', profileData);
    return response.data;
  },

  // Delete user profile
  async deleteProfile() {
    const response = await apiClient.delete('/user/profile');
    return response.data;
  },

  // Upload profile image
  async uploadProfileImage(imageFile: File) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await apiClient.post('/user/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

// Health Data API
export const healthAPI = {
  // Get health logs
  async getHealthLogs(limit = 50, offset = 0) {
    const response = await apiClient.get('/health/logs', {
      params: { limit, offset }
    });
    return response.data;
  },

  // Create health log
  async createHealthLog(logData: any) {
    const response = await apiClient.post('/health/logs', logData);
    return response.data;
  },

  // Update health log
  async updateHealthLog(logId: string, logData: any) {
    const response = await apiClient.put(`/health/logs/${logId}`, logData);
    return response.data;
  },

  // Delete health log
  async deleteHealthLog(logId: string) {
    const response = await apiClient.delete(`/health/logs/${logId}`);
    return response.data;
  },

  // Analyze food image
  async analyzeFoodImage(imageFile: File) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await apiClient.post('/health/analyze-food', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Save food data
  async saveFoodData(foodData: any) {
    const response = await apiClient.post('/health/food', foodData);
    return response.data;
  },

  // Get nutrition data
  async getNutritionData(foodId: string) {
    const response = await apiClient.get(`/health/nutrition/${foodId}`);
    return response.data;
  },

  // Track water intake
  async trackWaterIntake(amount: number) {
    const response = await apiClient.post('/health/water', { amount });
    return response.data;
  },

  // Track exercise
  async trackExercise(exerciseData: any) {
    const response = await apiClient.post('/health/exercise', exerciseData);
    return response.data;
  }
};

// Chat API with real-time support
export const chatAPI = {
  // Send message via HTTP
  async sendMessage(message: string, userContext?: any) {
    const response = await apiClient.post('/chat/message', { 
      message, 
      userContext 
    });
    return response.data;
  },

  // Get chat history
  async getChatHistory(limit = 50, offset = 0) {
    const response = await apiClient.get('/chat/history', {
      params: { limit, offset }
    });
    return response.data;
  },

  // Delete chat history
  async deleteChatHistory() {
    const response = await apiClient.delete('/chat/history');
    return response.data;
  },

  // Real-time chat methods using Socket.io
  realtime: {
    // Join chat room
    joinRoom(roomId: string) {
      const socket = socketManager.getSocket();
      if (socket) {
        socket.emit('join_room', roomId);
      }
    },

    // Leave chat room
    leaveRoom(roomId: string) {
      const socket = socketManager.getSocket();
      if (socket) {
        socket.emit('leave_room', roomId);
      }
    },

    // Send real-time message
    sendMessage(roomId: string, message: string) {
      const socket = socketManager.getSocket();
      if (socket) {
        socket.emit('chat_message', { roomId, message });
      }
    },

    // Listen for incoming messages
    onMessage(callback: (data: any) => void) {
      const socket = socketManager.getSocket();
      if (socket) {
        socket.on('chat_message', callback);
      }
    },

    // Listen for typing indicators
    onTyping(callback: (data: any) => void) {
      const socket = socketManager.getSocket();
      if (socket) {
        socket.on('user_typing', callback);
      }
    },

    // Send typing indicator
    sendTyping(roomId: string, isTyping: boolean) {
      const socket = socketManager.getSocket();
      if (socket) {
        socket.emit('typing', { roomId, isTyping });
      }
    }
  }
};

// Statistics API
export const statsAPI = {
  // Get health statistics
  async getHealthStats(period: '7days' | '30days' | '90days' = '30days') {
    const response = await apiClient.get('/stats/health', {
      params: { period }
    });
    return response.data;
  },

  // Get user activity stats
  async getActivityStats(period: '7days' | '30days' | '90days' = '30days') {
    const response = await apiClient.get('/stats/activity', {
      params: { period }
    });
    return response.data;
  },

  // Get nutrition stats
  async getNutritionStats(period: '7days' | '30days' | '90days' = '30days') {
    const response = await apiClient.get('/stats/nutrition', {
      params: { period }
    });
    return response.data;
  },

  // Get weight progress
  async getWeightProgress(period: '7days' | '30days' | '90days' = '30days') {
    const response = await apiClient.get('/stats/weight', {
      params: { period }
    });
    return response.data;
  },

  // Export health data
  async exportHealthData(format: 'json' | 'csv' | 'pdf' = 'json') {
    const response = await apiClient.get('/stats/export', {
      params: { format },
      responseType: format === 'pdf' ? 'blob' : 'json'
    });
    return response.data;
  }
};

// Notifications API with real-time support
export const notificationAPI = {
  // Get notifications
  async getNotifications(limit = 20, offset = 0) {
    const response = await apiClient.get('/notifications', {
      params: { limit, offset }
    });
    return response.data;
  },

  // Mark notification as read
  async markAsRead(notificationId: string) {
    const response = await apiClient.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  async markAllAsRead() {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  },

  // Delete notification
  async deleteNotification(notificationId: string) {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Real-time notification methods
  realtime: {
    // Listen for new notifications
    onNewNotification(callback: (notification: any) => void) {
      const socket = socketManager.getSocket();
      if (socket) {
        socket.on('new_notification', callback);
      }
    },

    // Listen for notification updates
    onNotificationUpdate(callback: (notification: any) => void) {
      const socket = socketManager.getSocket();
      if (socket) {
        socket.on('notification_update', callback);
      }
    }
  }
};

// Type definitions
export interface APIError {
  message: string;
  code?: string;
  details?: any;
  status?: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  success: boolean;
}

// Utility functions
export function setAuthToken(token: string) {
  localStorage.setItem('auth_token', token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function removeAuthToken() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

// Health check and system status
export const systemAPI = {
  // Health check
  async healthCheck() {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Get server status
  async getServerStatus() {
    const response = await apiClient.get('/status');
    return response.data;
  },

  // Get API version
  async getVersion() {
    const response = await apiClient.get('/version');
    return response.data;
  }
};

// Socket event helpers
export const socketEvents = {
  // Connect to socket
  connect() {
    return socketManager.connect();
  },

  // Disconnect socket
  disconnect() {
    socketManager.disconnect();
  },

  // Check if socket is connected
  isConnected(): boolean {
    return socketManager.isSocketConnected();
  },

  // Listen for connection events
  onConnect(callback: () => void) {
    const socket = socketManager.getSocket();
    if (socket) {
      socket.on('connect', callback);
    }
  },

  onDisconnect(callback: (reason: string) => void) {
    const socket = socketManager.getSocket();
    if (socket) {
      socket.on('disconnect', callback);
    }
  },

  // Custom event listeners
  on(event: string, callback: (...args: any[]) => void) {
    const socket = socketManager.getSocket();
    if (socket) {
      socket.on(event, callback);
    }
  },

  // Custom event emitters
  emit(event: string, ...args: any[]) {
    const socket = socketManager.getSocket();
    if (socket) {
      socket.emit(event, ...args);
    }
  },

  // Remove event listeners
  off(event: string, callback?: (...args: any[]) => void) {
    const socket = socketManager.getSocket();
    if (socket) {
      socket.off(event, callback);
    }
  }
};

// Export the configured axios instance for custom requests
export { apiClient };
