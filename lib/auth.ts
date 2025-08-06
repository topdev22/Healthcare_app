/// <reference types="vite/client" />

// Google OAuth configuration
declare global {
  interface Window {
    google: any;
    googleAuthInitialized: boolean;
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// User interface
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: "email" | "google";
  isEmailVerified: boolean;
}

// Google OAuth response
interface GoogleAuthResponse {
  credential: string;
  select_by: string;
}

// Initialize Google OAuth
export const initializeGoogleAuth = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already initialized
    if (window.googleAuthInitialized) {
      resolve();
      return;
    }

    // Skip initialization if no client ID
    if (!GOOGLE_CLIENT_ID) {
      console.warn(
        "Google Client ID not configured. Google authentication will not be available.",
      );
      resolve();
      return;
    }

    // Load Google Identity Services
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: () => {}, // Will be set per login attempt
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.googleAuthInitialized = true;
        resolve();
      } catch (error) {
        console.error("Failed to initialize Google Auth:", error);
        reject(error);
      }
    };

    script.onerror = () => {
      reject(new Error("Failed to load Google Identity Services"));
    };

    document.head.appendChild(script);
  });
};

// Google Sign-in with popup
export const signInWithGoogle = (): Promise<{
  googleId: string;
  email: string;
  displayName: string;
  photoURL?: string;
}> => {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error("Google authentication is not configured."));
      return;
    }

    if (!window.google || !window.googleAuthInitialized) {
      reject(new Error("Google authentication service is not initialized."));
      return;
    }

    // Set callback for this specific login attempt
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: GoogleAuthResponse) => {
        try {
          // Decode JWT token from Google
          const payload = JSON.parse(atob(response.credential.split(".")[1]));

          const userData = {
            googleId: payload.sub,
            email: payload.email,
            displayName: payload.name,
            photoURL: payload.picture,
          };

          resolve(userData);
        } catch (error) {
          console.error("Failed to decode Google token:", error);
          reject(new Error("Google authentication failed."));
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Show Google One Tap or popup
    window.google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback to popup if One Tap is not available
        window.google.accounts.id.renderButton(document.createElement("div"), {
          theme: "outline",
          size: "large",
          type: "standard",
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
        });

        // Trigger popup manually
        setTimeout(() => {
          reject(
            new Error(
              "Google authentication failed. If popup is not showing, please check your browser settings.",
            ),
          );
        }, 5000);
      }
    });
  });
};

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
