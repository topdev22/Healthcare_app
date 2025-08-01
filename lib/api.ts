// API ベースURL（環境変数から取得、デフォルトはローカル開発環境）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// 共通のフェッチ関数
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, defaultOptions);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// 認証関連API
export const authAPI = {
  // Googleログイン
  async signInWithGoogle(googleToken: string) {
    return fetchAPI('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token: googleToken }),
    });
  },

  // メールログイン
  async signInWithEmail(email: string, password: string) {
    return fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // メール登録
  async signUpWithEmail(email: string, password: string, displayName: string) {
    return fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
  },

  // ログアウト
  async logout() {
    localStorage.removeItem('auth_token');
    return fetchAPI('/auth/logout', { method: 'POST' });
  },

  // ユーザー情報取得
  async getCurrentUser() {
    return fetchAPI('/auth/me');
  },
};

// ユーザープロフィールAPI
export const userAPI = {
  // プロフィール取得
  async getProfile() {
    return fetchAPI('/user/profile');
  },

  // プロフィール更新
  async updateProfile(profileData: any) {
    return fetchAPI('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};

// 健康データAPI
export const healthAPI = {
  // 健康ログ取得
  async getHealthLogs(limit = 50) {
    return fetchAPI(`/health/logs?limit=${limit}`);
  },

  // 健康ログ作成
  async createHealthLog(logData: any) {
    return fetchAPI('/health/logs', {
      method: 'POST',
      body: JSON.stringify(logData),
    });
  },

  // 食事画像解析
  async analyzeFoodImage(imageFile: File) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const token = localStorage.getItem('auth_token');
    return fetch(`${API_BASE_URL}/health/analyze-food`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    }).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    });
  },

  // 食事データ保存
  async saveFoodData(foodData: any) {
    return fetchAPI('/health/food', {
      method: 'POST',
      body: JSON.stringify(foodData),
    });
  },
};

// チャットAPI
export const chatAPI = {
  // GPTとのチャット
  async sendMessage(message: string, userContext?: any) {
    return fetchAPI('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message, userContext }),
    });
  },

  // チャット履歴取得
  async getChatHistory(limit = 50) {
    return fetchAPI(`/chat/history?limit=${limit}`);
  },
};

// 統計API
export const statsAPI = {
  // 健康統計取得
  async getHealthStats(period: '7days' | '30days' | '90days' = '30days') {
    return fetchAPI(`/stats/health?period=${period}`);
  },
};

// エラーハンドリング用の型定義
export interface APIError {
  message: string;
  code?: string;
  details?: any;
}

// 認証トークンを設定
export function setAuthToken(token: string) {
  localStorage.setItem('auth_token', token);
}

// 認証トークンを取得
export function getAuthToken() {
  return localStorage.getItem('auth_token');
}

// 認証トークンを削除
export function removeAuthToken() {
  localStorage.removeItem('auth_token');
}
