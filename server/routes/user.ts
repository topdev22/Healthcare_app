import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth';
import { User } from '../models/User';
import { validateUserProfile, sanitizeUserProfile } from '../utils/validation';


const router = express.Router();

// Configure multer for profile image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(process.cwd(), 'public', 'profile');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req: any, file, cb) {
    // Generate unique filename: userId_timestamp.extension
    const userId = req.user._id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${userId}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

// File filter for images only
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: user.provider,
        isEmailVerified: user.isEmailVerified,
        age: user.age,
        gender: user.gender,
        height: user.height,
        activityLevel: user.activityLevel,
        healthGoals: user.healthGoals,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: any, res) => {
  try {
    console.log('=== Profile Update Request ===');
    console.log('Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user._id);
    
    const userId = req.user._id;
    
    // Sanitize and validate input data
    const sanitizedData = sanitizeUserProfile(req.body);
    console.log('Sanitized data:', JSON.stringify(sanitizedData, null, 2));
    
    const validation = validateUserProfile(sanitizedData);
    console.log('Validation result:', validation);
    
    if (!validation.isValid) {
      console.error('Validation failed:', validation.errors);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validation.errors 
      });
    }

    // Build update object with sanitized data
    const updateData: any = {
      ...sanitizedData,
      updatedAt: new Date()
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      console.error('User not found during profile update, userId:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Profile updated successfully:', updatedUser.displayName);

    res.json({
      success: true,
      data: {
        id: updatedUser._id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        photoURL: updatedUser.photoURL,
        provider: updatedUser.provider,
        isEmailVerified: updatedUser.isEmailVerified,
        age: updatedUser.age,
        gender: updatedUser.gender,
        height: updatedUser.height,
        activityLevel: updatedUser.activityLevel,
        healthGoals: updatedUser.healthGoals,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete user profile
router.delete('/profile', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Upload profile image
router.post('/profile/image', authenticateToken, upload.single('image'), async (req: any, res) => {
  try {
    const userId = req.user._id;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No image file provided' 
      });
    }

    // Generate the URL for the uploaded image
    const imageUrl = `/profile/${req.file.filename}`;
    
    // Delete old profile image if it exists
    const user = await User.findById(userId);
    if (user?.photoURL && user.photoURL.startsWith('/profile/')) {
      const oldImagePath = path.join(process.cwd(), 'public', user.photoURL);
      if (fs.existsSync(oldImagePath)) {
        try {
          fs.unlinkSync(oldImagePath);
          console.log('Deleted old profile image:', oldImagePath);
        } catch (error) {
          console.warn('Failed to delete old profile image:', error);
        }
      }
    }

    // Update user's photoURL in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        photoURL: imageUrl,
        updatedAt: new Date()
      },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    console.log(`Profile image uploaded for user ${userId}: ${imageUrl}`);

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        photoURL: imageUrl,
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          displayName: updatedUser.displayName,
          photoURL: updatedUser.photoURL,
          provider: updatedUser.provider,
          isEmailVerified: updatedUser.isEmailVerified,
          age: updatedUser.age,
          gender: updatedUser.gender,
          height: updatedUser.height,
          activityLevel: updatedUser.activityLevel,
          healthGoals: updatedUser.healthGoals,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Upload image error:', error);
    
    // Clean up uploaded file if database update fails
    if (req.file) {
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (cleanupError) {
          console.warn('Failed to cleanup uploaded file:', cleanupError);
        }
      }
    }
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false,
          message: 'File size too large. Maximum size is 5MB.' 
        });
      }
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

export default router;