import express from 'express';
import { authenticateToken } from '../middleware/auth';
import Achievement from '../models/Achievement';
import HealthLog from '../models/HealthLog';
import ChatMessage from '../models/ChatMessage';

const router = express.Router();

// Get all achievements for user
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const status = req.query.status; // 'completed', 'pending', or undefined for all
    
    let query: any = { userId };
    if (status === 'completed') {
      query.isCompleted = true;
    } else if (status === 'pending') {
      query.isCompleted = false;
    }

    const achievements = await Achievement.find(query)
      .sort({ isCompleted: 1, completedAt: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: achievements
    });

  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get achievement statistics
router.get('/stats', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;

    const [totalAchievements, completedAchievements, recentCompleted] = await Promise.all([
      Achievement.countDocuments({ userId }),
      Achievement.countDocuments({ userId, isCompleted: true }),
      Achievement.find({ 
        userId, 
        isCompleted: true,
        completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }).countDocuments()
    ]);

    const totalExperience = await Achievement.aggregate([
      { $match: { userId, isCompleted: true } },
      { $group: { _id: null, total: { $sum: '$experiencePoints' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalAchievements,
        completedAchievements,
        pendingAchievements: totalAchievements - completedAchievements,
        recentCompleted,
        totalExperience: totalExperience[0]?.total || 0,
        completionRate: totalAchievements > 0 ? Math.round((completedAchievements / totalAchievements) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Get achievement stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Initialize default achievements for a user
router.post('/initialize', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    
    // Check if user already has achievements
    const existingCount = await Achievement.countDocuments({ userId });
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: 'Achievements already initialized'
      });
    }

    // Create default achievements
    const defaultAchievements = [
      // Streak achievements
      {
        userId,
        type: 'streak',
        title: '3日連続記録！',
        description: '3日間連続で健康データを記録しました',
        icon: '🔥',
        experiencePoints: 10,
        requirement: { target: 3, current: 0, unit: 'days' },
        category: 'health',
        rarity: 'common'
      },
      {
        userId,
        type: 'streak',
        title: '一週間の習慣！',
        description: '7日間連続で健康データを記録しました',
        icon: '💪',
        experiencePoints: 25,
        requirement: { target: 7, current: 0, unit: 'days' },
        category: 'health',
        rarity: 'rare'
      },
      {
        userId,
        type: 'streak',
        title: '習慣マスター',
        description: '30日間連続で健康データを記録しました',
        icon: '🏆',
        experiencePoints: 100,
        requirement: { target: 30, current: 0, unit: 'days' },
        category: 'milestone',
        rarity: 'epic'
      },

      // Health log achievements
      {
        userId,
        type: 'logs_count',
        title: 'はじめの一歩',
        description: '初回の健康データを記録しました',
        icon: '🌱',
        experiencePoints: 5,
        requirement: { target: 1, current: 0, unit: 'logs' },
        category: 'health',
        rarity: 'common'
      },
      {
        userId,
        type: 'logs_count',
        title: '健康記録者',
        description: '10回の健康データを記録しました',
        icon: '📊',
        experiencePoints: 15,
        requirement: { target: 10, current: 0, unit: 'logs' },
        category: 'health',
        rarity: 'common'
      },
      {
        userId,
        type: 'logs_count',
        title: 'データコレクター',
        description: '50回の健康データを記録しました',
        icon: '📈',
        experiencePoints: 50,
        requirement: { target: 50, current: 0, unit: 'logs' },
        category: 'progress',
        rarity: 'rare'
      },

      // Conversation achievements
      {
        userId,
        type: 'conversation',
        title: 'おしゃべり好き',
        description: '健康バディと10回の会話をしました',
        icon: '💬',
        experiencePoints: 15,
        requirement: { target: 10, current: 0, unit: 'conversations' },
        category: 'social',
        rarity: 'common'
      },
      {
        userId,
        type: 'conversation',
        title: '相談パートナー',
        description: '健康バディと50回の会話をしました',
        icon: '🤝',
        experiencePoints: 40,
        requirement: { target: 50, current: 0, unit: 'conversations' },
        category: 'social',
        rarity: 'rare'
      },

      // Food tracking achievements
      {
        userId,
        type: 'food_tracking',
        title: 'フードロガー',
        description: '5回の食事記録を完了しました',
        icon: '🍽️',
        experiencePoints: 12,
        requirement: { target: 5, current: 0, unit: 'photos' },
        category: 'health',
        rarity: 'common'
      },
      {
        userId,
        type: 'food_tracking',
        title: '栄養管理マスター',
        description: '25回の食事記録を完了しました',
        icon: '🥗',
        experiencePoints: 35,
        requirement: { target: 25, current: 0, unit: 'photos' },
        category: 'health',
        rarity: 'rare'
      },

      // Exercise achievements
      {
        userId,
        type: 'exercise',
        title: '運動デビュー',
        description: '初回の運動を記録しました',
        icon: '🏃‍♀️',
        experiencePoints: 8,
        requirement: { target: 1, current: 0, unit: 'exercises' },
        category: 'health',
        rarity: 'common'
      },
      {
        userId,
        type: 'exercise',
        title: 'アクティブライフ',
        description: '10回の運動を記録しました',
        icon: '💪',
        experiencePoints: 30,
        requirement: { target: 10, current: 0, unit: 'exercises' },
        category: 'health',
        rarity: 'rare'
      }
    ];

    await Achievement.insertMany(defaultAchievements);

    res.status(201).json({
      success: true,
      message: 'Default achievements initialized',
      count: defaultAchievements.length
    });

  } catch (error) {
    console.error('Initialize achievements error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Check and update achievement progress
router.post('/check-progress', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    
    const newlyCompleted = await checkAndUpdateAchievements(userId);

    res.json({
      success: true,
      newlyCompleted,
      count: newlyCompleted.length
    });

  } catch (error) {
    console.error('Check achievement progress error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Helper function to check and update achievements
export async function checkAndUpdateAchievements(userId: string) {
  const newlyCompleted = [];

  try {
    // Get pending achievements
    const pendingAchievements = await Achievement.find({
      userId,
      isCompleted: false
    });

    // Get user statistics
    const [healthLogs, conversations, exerciseLogs, foodLogs] = await Promise.all([
      HealthLog.find({ userId }).lean(),
      ChatMessage.countDocuments({ userId, sender: 'user' }),
      HealthLog.countDocuments({ userId, type: 'exercise' }),
      HealthLog.countDocuments({ userId, type: 'food' })
    ]);

    // Calculate current streak
    const currentStreak = calculateCurrentStreak(healthLogs);

    for (const achievement of pendingAchievements) {
      let currentProgress = 0;

      switch (achievement.type) {
        case 'streak':
          currentProgress = currentStreak;
          break;
        case 'logs_count':
          currentProgress = healthLogs.length;
          break;
        case 'conversation':
          currentProgress = conversations;
          break;
        case 'exercise':
          currentProgress = exerciseLogs;
          break;
        case 'food_tracking':
          currentProgress = foodLogs;
          break;
      }

      // Update current progress
      achievement.requirement.current = currentProgress;

      // Check if achievement is completed
      if (currentProgress >= achievement.requirement.target && !achievement.isCompleted) {
        achievement.isCompleted = true;
        achievement.completedAt = new Date();
        newlyCompleted.push(achievement);
      }

      await achievement.save();
    }

  } catch (error) {
    console.error('Error checking achievements:', error);
  }

  return newlyCompleted;
}

// Helper function to calculate current streak
function calculateCurrentStreak(logs: any[]): number {
  if (logs.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group logs by date
  const logsByDate = new Map();
  logs.forEach(log => {
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);
    const dateKey = logDate.getTime();
    
    if (!logsByDate.has(dateKey)) {
      logsByDate.set(dateKey, []);
    }
    logsByDate.get(dateKey).push(log);
  });

  // Check consecutive days
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
    const dateKey = checkDate.getTime();
    
    if (logsByDate.has(dateKey)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export default router;