import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { User } from '../models/User';
import { validateUserProfile, sanitizeUserProfile } from '../utils/validation';


const router = express.Router();

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
    console.log('updateProfile', req.body, 'userId:', req.user._id);
    const userId = req.user._id;
    
    // Sanitize and validate input data
    const sanitizedData = sanitizeUserProfile(req.body);
    const validation = validateUserProfile(sanitizedData);
    
    if (!validation.isValid) {
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

// Upload profile image (placeholder - would need multer for actual file upload)
router.post('/profile/image', authenticateToken, async (req: any, res) => {
  try {
    // This is a placeholder implementation
    // In a real application, you would use multer to handle file uploads
    // and store images in cloud storage like AWS S3, Cloudinary, etc.
    
    res.json({
      success: true,
      message: 'Image upload endpoint - implementation needed',
      data: {
        photoURL: 'https://via.placeholder.com/150' // Placeholder image
      }
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;