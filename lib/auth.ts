// User interface
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: "email" | "google";
  isEmailVerified: boolean;
}

// Email/Password validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): string[] => {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  // More flexible validation - only require minimum length
  // Remove strict requirements for letters and numbers to improve UX

  return errors;
};

// Utility functions for auth state management
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("auth_token");
};

export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem("auth_user");
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setStoredUser = (user: User): void => {
  localStorage.setItem("auth_user", JSON.stringify(user));
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem("auth_token", token);
};

export const clearAuthStorage = (): void => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
};

// Auth state listeners
type AuthStateListener = (user: User | null) => void;
const authStateListeners: AuthStateListener[] = [];

export const addAuthStateListener = (listener: AuthStateListener): void => {
  authStateListeners.push(listener);
};

export const removeAuthStateListener = (listener: AuthStateListener): void => {
  const index = authStateListeners.indexOf(listener);
  if (index > -1) {
    authStateListeners.splice(index, 1);
  }
};

export const notifyAuthStateChange = (user: User | null): void => {
  authStateListeners.forEach((listener) => listener(user));
};
