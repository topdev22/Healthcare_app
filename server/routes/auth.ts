import { Router, RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import { generateToken } from '../utils/jwt';
import { authenticateToken, AuthRequest } from '../middleware/auth';


const router = Router();

// Request/Response interfaces
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

interface GoogleAuthRequest {
  googleId: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    photoURL?: string;
    provider: string;
    isEmailVerified: boolean;
  };
  isNewUser?: boolean;
}

// Email/Password Registration
export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const { email, password, displayName }: RegisterRequest = req.body;

    // Validation
    if (!email || !password || !displayName) {
      return res.status(400).json({ 
        message: 'Email, password, and display name are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ 
        message: 'User with this email already exists' 
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      displayName: displayName.trim(),
      provider: 'email',
      isEmailVerified: false
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    const response: AuthResponse = {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: user.provider,
        isEmailVerified: user.isEmailVerified
      },
      isNewUser: true
    };

    res.status(201).json(response);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Email/Password Login
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    console.log('Login request received:', req.body);

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.provider !== 'email') {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password!);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    const response: AuthResponse = {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: user.provider,
        isEmailVerified: user.isEmailVerified
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Google Authentication
export const handleGoogleAuth: RequestHandler = async (req, res) => {
  try {
    const { googleId, email, displayName, photoURL }: GoogleAuthRequest = req.body;

    // Validation
    if (!googleId || !email || !displayName) {
      return res.status(400).json({ 
        message: 'Google ID, email, and display name are required' 
      });
    }

    let user = await User.findOne({ 
      $or: [
        { googleId: googleId },
        { email: email.toLowerCase() }
      ]
    });

    let isNewUser = false;

    if (!user) {
      // Create new user
      user = new User({
        email: email.toLowerCase(),
        displayName: displayName.trim(),
        photoURL: photoURL || undefined,
        provider: 'google',
        googleId: googleId,
        isEmailVerified: true // Google accounts are considered verified
      });

      await user.save();
      isNewUser = true;
    } else if (!user.googleId) {
      // Link existing email account with Google
      user.googleId = googleId;
      user.photoURL = photoURL || user.photoURL;
      user.isEmailVerified = true;
      await user.save();
    } else if (user.googleId !== googleId) {
      return res.status(409).json({ 
        message: 'This email is associated with a different Google account' 
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    const response: AuthResponse = {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: user.provider,
        isEmailVerified: user.isEmailVerified
      },
      isNewUser
    };

    res.json(response);

  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(500).json({ 
      message: 'Google authentication failed',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Get current user profile
export const handleGetProfile: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: user.provider,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      message: 'Failed to get user profile',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Logout (client-side token removal, but we can track this for analytics)
export const handleLogout: RequestHandler = async (req: AuthRequest, res) => {
  try {
    // In a JWT-based system, logout is primarily handled client-side by removing the token
    // Here we just acknowledge the logout request
    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};



// Auth routes
router.post('/register', handleRegister);
router.post('/login', handleLogin);
router.post('/google', handleGoogleAuth);
router.post('/logout', authenticateToken, handleLogout);
router.get('/profile', authenticateToken, handleGetProfile);

export default router;