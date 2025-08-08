import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI, userAPI, setAuthToken, removeAuthToken, getAuthToken } from '@/lib/api';
import { 
  signInWithGoogle as googleSignIn, 
  validateEmail, 
  validatePassword,
  initializeGoogleAuth,
  isAuthenticated,
  getStoredUser,
  setStoredUser,
  setStoredToken,
  clearAuthStorage,
  addAuthStateListener,
  removeAuthStateListener,
  notifyAuthStateChange,
  User as AuthUser
} from '@/lib/auth';

interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: 'email' | 'google';
  isEmailVerified: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: 'email' | 'google';
  isEmailVerified: boolean;
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
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  setUserProfile: (profile: UserProfile) => void;
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
    const initializeAuth = async () => {
      try {
        // Initialize Google Auth
        await initializeGoogleAuth();
        
        // Check if user is already authenticated
        const storedUser = getStoredUser();
        const token = getAuthToken();
        
        if (storedUser && token && isAuthenticated()) {
          try {
            // Verify token is still valid by getting current user from backend
            const response = await authAPI.getCurrentUser();
            setCurrentUser(response.user);
            
            // Try to get user profile
            try {
              const profileResponse = await userAPI.getProfile();
              // Handle the case where the API returns a success wrapper
              const profileData = profileResponse.data || profileResponse;
              setUserProfile(profileData);
            } catch (profileError: any) {
              console.log('Profile not found, user may need to complete setup', profileError?.message || profileError);
            }
          } catch (error) {
            console.error('Token validation failed:', error);
            await handleAuthError();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state listener
    const handleAuthStateChange = (user: User | null) => {
      setCurrentUser(user);
    };

    addAuthStateListener(handleAuthStateChange);

    return () => {
      removeAuthStateListener(handleAuthStateChange);
    };
  }, []);

  const handleAuthSuccess = async (response: any) => {
    try {
      // Store token and user data
      setAuthToken(response.token);
      setStoredToken(response.token);
      setStoredUser(response.user);
      
      // Set user data
      setCurrentUser(response.user);
      
      // Notify auth state change
      notifyAuthStateChange(response.user);

      // Get user profile if available
      if (response.profile) {
        setUserProfile(response.profile);
      } else {
        try {
          const profileResponse = await userAPI.getProfile();
          // Handle the case where the API returns a success wrapper
          const profileData = profileResponse.data || profileResponse;
          setUserProfile(profileData);
        } catch (profileError: any) {
          console.log('Profile not found, user may need to complete setup', profileError?.message || profileError);
        }
      }
    } catch (error) {
      console.error('Auth success handling error:', error);
      throw error;
    }
  };

  const handleAuthError = async () => {
    clearAuthStorage();
    setCurrentUser(null);
    setUserProfile(null);
    notifyAuthStateChange(null);
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      
      // Get Google user data from frontend OAuth
      const googleData = await googleSignIn();
      
      // Send Google data to backend
      const response = await authAPI.signInWithGoogle(googleData);
      
      // Handle successful authentication
      await handleAuthSuccess(response);
      
    } catch (error) {
      console.error('Google authentication error:', error);
      await handleAuthError();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Validate email and password
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Validate email format
      if (!validateEmail(email)) {
        throw new Error('有効なメールアドレスを入力してください。');
      }
      
      // Validate password
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        throw new Error(passwordErrors[0]);
      }
      
      // Sign in with backend
      const response = await authAPI.signInWithEmail(email, password);
      
      // Handle successful authentication
      await handleAuthSuccess(response);
      
    } catch (error) {
      console.error('Email authentication error:', error);
      await handleAuthError();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      
      // Validate email, password, and displayName presence
      if (!email || !password || !displayName) {
        throw new Error('Email, password, and display name are required');
      }
      
      // Validate email format
      if (!validateEmail(email)) {
        throw new Error('有効なメールアドレスを入力してください。');
      }
      
      // Validate password
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        throw new Error(passwordErrors[0]);
      }
      
      // Validate display name
      if (!displayName.trim()) {
        throw new Error('表示名を入力してください。');
      }
      
      // Register with backend
      const response = await authAPI.signUpWithEmail(email, password, displayName.trim());
      
      // Handle successful registration
      await handleAuthSuccess(response);
      
    } catch (error) {
      console.error('Registration error:', error);
      await handleAuthError();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Call backend logout
      try {
        await authAPI.logout();
      } catch (error) {
        console.log('Backend logout error (may be expected):', error);
      }
      
      // Clean up local state
      await handleAuthError();
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clean up local state
      await handleAuthError();
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (profileData: Partial<UserProfile>) => {
    try {
      const updatedProfileResponse = await userAPI.updateProfile(profileData);
      // Handle the case where the API returns a success wrapper
      const updatedProfile = updatedProfileResponse.data || updatedProfileResponse;
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const setUserProfileDirectly = (profile: UserProfile) => {
    setUserProfile(profile);
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    updateUserProfile,
    setUserProfile: setUserProfileDirectly
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
