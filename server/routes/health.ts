import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import HealthLog from '../models/HealthLog';
import { checkAndUpdateAchievements } from './achievements';
import ChatGPTFoodService from '../services/chatgptFoodService';
import {
  validateHealthLog,
  validateFoodData,
  sanitizeHealthLogData,
  sanitizeFoodData
} from '../utils/validation';
import {
  HealthLogResponse,
  HealthLogsResponse,
  HealthStatsResponse,
  CreateHealthLogRequest
} from '../../shared/types/health';

const router = express.Router();

// Socket.IO instance will be injected
let io: any = null;
export const setSocketIO = (socketIO: any) => {
  io = socketIO;
};

// Configure multer for food image upload
const storage = multer.memoryStorage(); // Store in memory for processing

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
  // No file size limits - allow unlimited uploads
});

// Get health logs
router.get('/logs', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const type = req.query.type as string;

    // Build query
    const query: any = { userId };
    if (type) {
      query.type = type;
    }

    const logs = await HealthLog.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    const totalCount = await HealthLog.countDocuments(query);

    const response: HealthLogsResponse = {
      success: true,
      data: logs as any[],
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    };
    res.json(response);
  } catch (error) {
    console.error('Get health logs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create health log
router.post('/logs', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    
    // Sanitize and validate input data
    const sanitizedData = sanitizeHealthLogData(req.body);
    const validation = validateHealthLog(sanitizedData);
    
    if (!validation.isValid) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validation.errors 
      });
    }

    const healthLog = new HealthLog({
      userId,
      type: sanitizedData.type,
      title: sanitizedData.title,
      description: sanitizedData.description,
      data: sanitizedData.data || {},
      date: sanitizedData.date ? new Date(sanitizedData.date) : new Date()
    });

    await healthLog.save();

    // Emit real-time update for new health log
    if (io) {
      io.to('health_updates').emit('new_health_log', {
        userId,
        log: healthLog,
        timestamp: new Date().toISOString()
      });
      console.log(`📡 Emitted new_health_log event for user ${userId}`);
    }

    // Check for achievement progress
    try {
      const newlyCompleted = await checkAndUpdateAchievements(userId);
      if (newlyCompleted.length > 0) {
        console.log(`🎉 User ${userId} completed ${newlyCompleted.length} new achievements!`);
        
        // Trigger character refresh for achievement completion
        try {
          const { calculateDashboardStats } = await import('./dashboard');
          await calculateDashboardStats(userId, new Date());
          
          // Emit health data update after dashboard recalculation
          if (io) {
            io.to('health_updates').emit('health_data_updated', {
              userId,
              type: 'dashboard_refresh',
              timestamp: new Date().toISOString()
            });
          }
        } catch (dashboardError) {
          console.warn('Dashboard stats update failed after achievement:', dashboardError);
        }
      }
    } catch (achievementError) {
      console.warn('Achievement check failed:', achievementError);
      // Don't fail the health log creation if achievement check fails
    }

    const response: HealthLogResponse = {
      success: true,
      data: healthLog as any
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Create health log error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update health log
router.put('/logs/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const logId = req.params.id;
    const { type, title, description, data, date } = req.body;

    const updatedLog = await HealthLog.findOneAndUpdate(
      { _id: logId, userId }, // Ensure user owns the log
      {
        type,
        title,
        description,
        data,
        date: date ? new Date(date) : undefined,
        updatedAt: new Date()
      },
      { new: true, lean: true }
    );

    if (!updatedLog) {
      return res.status(404).json({ message: 'Health log not found' });
    }

    const response: HealthLogResponse = {
      success: true,
      data: updatedLog as any
    };
    res.json(response);
  } catch (error) {
    console.error('Update health log error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete health log
router.delete('/logs/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const logId = req.params.id;

    const deletedLog = await HealthLog.findOneAndDelete({
      _id: logId,
      userId // Ensure user owns the log
    });

    if (!deletedLog) {
      return res.status(404).json({ message: 'Health log not found' });
    }

    res.json({
      success: true,
      message: 'Health log deleted successfully'
    });
  } catch (error) {
    console.error('Delete health log error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Analyze food image (placeholder)
router.post('/analyze-food', authenticateToken, upload.single('image'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No image file provided' 
      });
    }

    console.log('Received image file:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Convert image buffer to base64 for API calls
    const imageBase64 = req.file.buffer.toString('base64');
    const imageData = `data:${req.file.mimetype};base64,${imageBase64}`;

    // Use ChatGPTFoodService for food analysis
    try {
      if (ChatGPTFoodService.isConfigured()) {
        const chatgptService = new ChatGPTFoodService();
        const analysisResult = await chatgptService.analyzeFoodImage(imageData);
        
        // Ensure the response is properly formatted JSON
        const jsonResponse = {
          success: true,
          message: 'Food analysis completed successfully',
          data: {
            foodItems: analysisResult.foodItems || [],
            totalCalories: analysisResult.totalCalories || 0,
            analysisTimestamp: new Date().toISOString(),
            source: 'chatgpt-api'
          }
        };
        
        console.log('📊 Food analysis JSON response:', JSON.stringify(jsonResponse, null, 2));
        res.json(jsonResponse);
        
      } else {
        // Use fallback data if ChatGPT is not configured
        const fallbackResult = ChatGPTFoodService.getFallbackAnalysis(imageData);
        
        const jsonResponse = {
          success: true,
          message: 'Using fallback analysis (ChatGPT API not configured)',
          data: {
            ...fallbackResult,
            analysisTimestamp: new Date().toISOString(),
            source: 'fallback-data'
          }
        };
        
        console.log('📊 Fallback analysis JSON response:', JSON.stringify(jsonResponse, null, 2));
        res.json(jsonResponse);
      }
    } catch (apiError) {
      console.error('Food analysis error:', apiError);
      
      // Return error message instead of fallback data
      res.status(503).json({
        success: false,
        message: '食事画像の解析サービスが一時的に利用できません。しばらく時間をおいてから再度お試しください。',
        error: apiError instanceof Error ? apiError.message : 'Unknown error',
        retryAfter: 300 // 5 minutes
      });
    }
  } catch (error) {
    console.error('Analyze food error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Get ChatGPT service status
router.get('/chatgpt-status', authenticateToken, async (req: any, res) => {
  try {
    const status = ChatGPTFoodService.getStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        message: status.configured 
          ? 'ChatGPT API is properly configured' 
          : 'ChatGPT API is not configured. Using fallback data.'
      }
    });
  } catch (error) {
    console.error('ChatGPT status check error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to check ChatGPT service status' 
    });
  }
});

// Debug endpoint to get raw JSON response (development only)
router.post('/analyze-food-debug', authenticateToken, upload.single('image'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No image file provided' 
      });
    }

    if (!ChatGPTFoodService.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'ChatGPT API is not configured'
      });
    }

    const imageBase64 = req.file.buffer.toString('base64');
    const imageData = `data:${req.file.mimetype};base64,${imageBase64}`;

    const chatgptService = new ChatGPTFoodService();
    const rawResponse = await chatgptService.getRawJsonResponse(imageData);
    
    res.json({
      success: true,
      message: 'Raw JSON response from ChatGPT API',
      data: {
        rawResponse,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Debug analysis error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get raw JSON response',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Save food data
router.post('/food', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    
    // Sanitize and validate input data
    const sanitizedData = sanitizeFoodData(req.body);
    const validation = validateFoodData(sanitizedData);
    
    if (!validation.isValid) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validation.errors 
      });
    }

    const foodLog = new HealthLog({
      userId,
      type: 'food',
      title: `${sanitizedData.meal || 'Food'}: ${sanitizedData.name}`,
      data: {
        name: sanitizedData.name,
        calories: sanitizedData.calories,
        nutrition: sanitizedData.nutrition || {},
        meal: sanitizedData.meal || 'other',
        imageUrl: sanitizedData.imageUrl
      },
      date: sanitizedData.date ? new Date(sanitizedData.date) : new Date()
    });

    await foodLog.save();

    const response: HealthLogResponse = {
      success: true,
      data: foodLog as any
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Save food data error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get nutrition data for specific food
router.get('/nutrition/:foodId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const foodId = req.params.foodId;

    const foodLog = await HealthLog.findOne({
      _id: foodId,
      userId,
      type: 'food'
    }).lean();

    if (!foodLog) {
      return res.status(404).json({ message: 'Food log not found' });
    }

    res.json({
      success: true,
      data: {
        id: foodLog._id,
        name: (foodLog.data as any).name,
        calories: (foodLog.data as any).calories,
        nutrition: (foodLog.data as any).nutrition,
        date: foodLog.date
      }
    });
  } catch (error) {
    console.error('Get nutrition data error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get health statistics for character
router.get('/stats', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const period = req.query.period || '30days';

    // Calculate date range
    const now = new Date();
    let daysBack = 30;
    if (period === '7days') daysBack = 7;
    else if (period === '90days') daysBack = 90;
    
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Get health logs in period
    const healthLogs = await HealthLog.find({ 
      userId, 
      date: { $gte: startDate } 
    })
      .sort({ date: -1 })
      .lean();

    // Calculate statistics
    const totalLogs = await HealthLog.countDocuments({ userId });
    const weeklyLogs = healthLogs.filter(log => {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return new Date(log.date) >= oneWeekAgo;
    }).length;

    // Get logs by type
    const exerciseLogs = healthLogs.filter(log => log.type === 'exercise');
    const waterLogs = healthLogs.filter(log => log.type === 'water');
    const sleepLogs = healthLogs.filter(log => log.type === 'sleep');
    const moodLogs = healthLogs.filter(log => log.type === 'mood');
    const weightLogs = healthLogs.filter(log => log.type === 'weight');

    // Calculate recent mood
    const recentMood = moodLogs.length > 0 ? (moodLogs[0].data as any)?.mood || 'neutral' : 'neutral';

    // Calculate average weight
    const averageWeight = weightLogs.length > 0 
      ? weightLogs.reduce((sum, log) => sum + ((log.data as any)?.weight || 0), 0) / weightLogs.length
      : undefined;

    // Calculate today's water intake
    const today = new Date().toDateString();
    const todayWaterLogs = waterLogs.filter(log => 
      new Date(log.date).toDateString() === today
    );
    const waterIntake = todayWaterLogs.reduce((sum, log) => 
      sum + ((log.data as any)?.amount || 0), 0
    );

    // Get recent sleep hours
    const recentSleepLog = sleepLogs[0];
    const sleepHours = (recentSleepLog?.data as any)?.hours;

    // Calculate streak
    let streak = 0;
    const logsByDate = new Map();
    healthLogs.forEach(log => {
      const logDate = new Date(log.date).toDateString();
      if (!logsByDate.has(logDate)) {
        logsByDate.set(logDate, []);
      }
      logsByDate.get(logDate).push(log);
    });

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dateString = checkDate.toDateString();
      
      if (logsByDate.has(dateString)) {
        streak++;
      } else {
        break;
      }
    }

    const response: HealthStatsResponse = {
      success: true,
      data: {
        totalLogs,
        weeklyLogs,
        recentMood,
        averageWeight,
        exerciseCount: exerciseLogs.length,
        waterIntake,
        sleepHours,
        streak,
        period,
        healthLogs: healthLogs.slice(0, 20) as any[] // Return recent 20 logs for frontend processing
      }
    };
    res.json(response);

  } catch (error) {
    console.error('Get health stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Track water intake
router.post('/water', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const { amount, date } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid water amount is required' });
    }

    const waterLog = new HealthLog({
      userId,
      type: 'water',
      title: `Water intake: ${amount}ml`,
      data: {
        amount: amount,
        unit: 'ml'
      },
      date: date ? new Date(date) : new Date()
    });

    await waterLog.save();

    // Emit real-time update for water intake
    if (io) {
      io.to('health_updates').emit('new_health_log', {
        userId,
        log: waterLog,
        type: 'water',
        timestamp: new Date().toISOString()
      });
      
      // Also emit a general health data update to trigger dashboard refresh
      io.to('health_updates').emit('health_data_updated', {
        userId,
        type: 'water_intake',
        amount,
        timestamp: new Date().toISOString()
      });
      console.log(`📡 Emitted water intake update for user ${userId}: ${amount}ml`);
    }

    const response: HealthLogResponse = {
      success: true,
      data: waterLog as any
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Track water error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Track exercise
router.post('/exercise', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const { type, duration, intensity, calories, date } = req.body;

    if (!type || !duration) {
      return res.status(400).json({ message: 'Exercise type and duration are required' });
    }

    const exerciseLog = new HealthLog({
      userId,
      type: 'exercise',
      title: `${type} - ${duration} minutes`,
      data: {
        exerciseType: type,
        duration: duration,
        intensity: intensity || 'moderate',
        caloriesBurned: calories || 0
      },
      date: date ? new Date(date) : new Date()
    });

    await exerciseLog.save();

    // Emit real-time update for exercise
    if (io) {
      io.to('health_updates').emit('new_health_log', {
        userId,
        log: exerciseLog,
        type: 'exercise',
        timestamp: new Date().toISOString()
      });
      
      // Also emit a general health data update to trigger dashboard refresh
      io.to('health_updates').emit('health_data_updated', {
        userId,
        type: 'exercise',
        duration,
        timestamp: new Date().toISOString()
      });
      console.log(`📡 Emitted exercise update for user ${userId}: ${type} for ${duration} minutes`);
    }

    const response: HealthLogResponse = {
      success: true,
      data: exerciseLog as any
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Track exercise error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;