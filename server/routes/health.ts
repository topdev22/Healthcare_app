import express from 'express';
import { authenticateToken } from '../middleware/auth';
import HealthLog from '../models/HealthLog';


const router = express.Router();

// Get health logs
router.get('/logs', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
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

    res.json({
      success: true,
      data: logs,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });
  } catch (error) {
    console.error('Get health logs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create health log
router.post('/logs', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { type, title, description, data, date } = req.body;

    // Validate required fields
    if (!type || !title) {
      return res.status(400).json({ message: 'Type and title are required' });
    }

    const healthLog = new HealthLog({
      userId,
      type,
      title,
      description,
      data: data || {},
      date: date ? new Date(date) : new Date()
    });

    await healthLog.save();

    res.status(201).json({
      success: true,
      data: healthLog
    });
  } catch (error) {
    console.error('Create health log error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update health log
router.put('/logs/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
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

    res.json({
      success: true,
      data: updatedLog
    });
  } catch (error) {
    console.error('Update health log error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete health log
router.delete('/logs/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
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
router.post('/analyze-food', authenticateToken, async (req: any, res) => {
  try {
    // Placeholder for food image analysis
    // In a real implementation, you would integrate with:
    // - Google Vision API
    // - AWS Rekognition
    // - Custom ML model
    // - Food recognition service like Edamam or Spoonacular

    res.json({
      success: true,
      message: 'Food analysis endpoint - AI integration needed',
      data: {
        detectedFoods: [
          {
            name: 'Apple',
            confidence: 0.95,
            calories: 52,
            nutrition: {
              carbs: 14,
              fiber: 2.4,
              sugars: 10,
              protein: 0.3,
              fat: 0.2
            }
          }
        ]
      }
    });
  } catch (error) {
    console.error('Analyze food error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Save food data
router.post('/food', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { name, calories, nutrition, meal, date } = req.body;

    if (!name || calories === undefined) {
      return res.status(400).json({ message: 'Food name and calories are required' });
    }

    const foodLog = new HealthLog({
      userId,
      type: 'food',
      title: `${meal || 'Food'}: ${name}`,
      data: {
        name,
        calories,
        nutrition: nutrition || {},
        meal: meal || 'other'
      },
      date: date ? new Date(date) : new Date()
    });

    await foodLog.save();

    res.status(201).json({
      success: true,
      data: foodLog
    });
  } catch (error) {
    console.error('Save food data error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get nutrition data for specific food
router.get('/nutrition/:foodId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
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
        name: foodLog.data.name,
        calories: foodLog.data.calories,
        nutrition: foodLog.data.nutrition,
        date: foodLog.date
      }
    });
  } catch (error) {
    console.error('Get nutrition data error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Track water intake
router.post('/water', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
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

    res.status(201).json({
      success: true,
      data: waterLog
    });
  } catch (error) {
    console.error('Track water error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Track exercise
router.post('/exercise', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
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

    res.status(201).json({
      success: true,
      data: exerciseLog
    });
  } catch (error) {
    console.error('Track exercise error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;