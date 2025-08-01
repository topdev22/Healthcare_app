import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI, userAPI, setAuthToken, removeAuthToken, getAuthToken } from '@/lib/api';

interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  healthGoals?: string[];
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: (googleToken: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // バックエンドから現在のユーザー情報を取得
      const userData = await authAPI.getCurrentUser();
      setCurrentUser(userData.user);
      
      // ユーザープロフィールを取得
      const profileData = await userAPI.getProfile();
      setUserProfile(profileData);
    } catch (error) {
      console.error('認証状態の確認エラー:', error);
      removeAuthToken();
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (googleToken: string) => {
    try {
      const response = await authAPI.signInWithGoogle(googleToken);
      setAuthToken(response.token);
      setCurrentUser(response.user);
      
      // プロフィールを取得
      const profileData = await userAPI.getProfile();
      setUserProfile(profileData);
    } catch (error) {
      console.error('Google認証エラー:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const response = await authAPI.signInWithEmail(email, password);
      setAuthToken(response.token);
      setCurrentUser(response.user);
      
      // プロフィールを取得
      const profileData = await userAPI.getProfile();
      setUserProfile(profileData);
    } catch (error) {
      console.error('メール認証エラー:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const response = await authAPI.signUpWithEmail(email, password, displayName);
      setAuthToken(response.token);
      setCurrentUser(response.user);
      setUserProfile(response.profile);
    } catch (error) {
      console.error('ユーザー登録エラー:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      removeAuthToken();
      setCurrentUser(null);
      setUserProfile(null);
    }
  };

  const updateUserProfile = async (profileData: Partial<UserProfile>) => {
    try {
      const updatedProfile = await userAPI.updateProfile(profileData);
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
