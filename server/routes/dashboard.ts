import express from 'express';
import { authenticateToken } from '../middleware/auth';
import DashboardStats from '../models/DashboardStats';
import Achievement from '../models/Achievement';
import HealthLog from '../models/HealthLog';
import ChatMessage from '../models/ChatMessage';
import { User } from '../models/User';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get or create today's dashboard stats
    let dashboardStats = await DashboardStats.findOne({
      userId,
      date: today
    });

    if (!dashboardStats) {
      // Calculate and create new dashboard stats
      dashboardStats = await calculateDashboardStats(userId, today);
    } else {
      // Update existing stats (refresh if older than 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (dashboardStats.updatedAt < oneHourAgo) {
        dashboardStats = await calculateDashboardStats(userId, today);
      }
    }

    res.json({
      success: true,
      data: dashboardStats
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get quick stats for cards
router.get('/quick-stats', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's dashboard stats
    const dashboardStats = await DashboardStats.findOne({
      userId,
      date: today
    });

    if (!dashboardStats) {
      // Return default values if no stats exist
      return res.json({
        success: true,
        data: {
          healthLevel: 50,
          streakDays: 0,
          todayCalories: 0,
          characterLevel: 1
        }
      });
    }

    res.json({
      success: true,
      data: {
        healthLevel: dashboardStats.healthLevel,
        streakDays: dashboardStats.currentStreak,
        todayCalories: dashboardStats.dailyCalories,
        characterLevel: dashboardStats.characterLevel
      }
    });

  } catch (error) {
    console.error('Get quick stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get recent achievements
router.get('/achievements', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const achievements = await Achievement.find({
      userId,
      isCompleted: true
    })
      .sort({ completedAt: -1 })
      .limit(limit)
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

// Get progress data for character growth
router.get('/progress', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get dashboard stats
    const dashboardStats = await DashboardStats.findOne({
      userId,
      date: today
    });

    // Get recent achievements for progress tracking
    const recentAchievements = await Achievement.find({
      userId,
      isCompleted: true
    })
      .sort({ completedAt: -1 })
      .limit(5)
      .lean();

    // Calculate progress metrics
    const healthLogs = await HealthLog.countDocuments({ userId });
    const conversations = await ChatMessage.countDocuments({ 
      userId, 
      sender: 'user' 
    });

    res.json({
      success: true,
      data: {
        characterLevel: dashboardStats?.characterLevel || 1,
        experiencePoints: dashboardStats?.experiencePoints || 0,
        experienceToNextLevel: dashboardStats?.experienceToNextLevel || 100,
        totalHealthLogs: healthLogs,
        totalConversations: conversations,
        recentAchievements,
        nextLevelProgress: dashboardStats ? 
          Math.round((dashboardStats.experiencePoints / dashboardStats.experienceToNextLevel) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Calculate comprehensive dashboard statistics
async function calculateDashboardStats(userId: string, date: Date) {
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get user profile for goals
  const user = await User.findById(userId);
  
  // Get today's health logs
  const todayLogs = await HealthLog.find({
    userId,
    date: { $gte: date, $lt: tomorrow }
  }).lean();

  // Get all health logs for streak calculation
  const allLogs = await HealthLog.find({ userId })
    .sort({ date: -1 })
    .lean();

  // Calculate streak
  const streak = calculateStreak(allLogs);
  
  // Calculate today's metrics
  const dailyCalories = todayLogs
    .filter(log => log.type === 'food')
    .reduce((sum, log) => sum + (log.data?.calories || 0), 0);

  const exerciseMinutes = todayLogs
    .filter(log => log.type === 'exercise')
    .reduce((sum, log) => sum + (log.data?.minutes || 0), 0);

  const waterIntake = todayLogs
    .filter(log => log.type === 'water')
    .reduce((sum, log) => sum + (log.data?.amount || 0), 0);

  // Get current weight
  const weightLogs = await HealthLog.find({
    userId,
    type: 'weight'
  }).sort({ date: -1 }).limit(1).lean();
  
  const currentWeight = weightLogs[0]?.data?.weight;

  // Get current mood
  const moodLogs = todayLogs.filter(log => log.type === 'mood');
  const currentMood = moodLogs[0]?.data?.mood || 'neutral';

  // Get sleep data
  const sleepLogs = todayLogs.filter(log => log.type === 'sleep');
  const sleepHours = sleepLogs[0]?.data?.hours;

  // Calculate health level
  const healthLevel = calculateHealthLevel({
    dailyLogs: todayLogs.length,
    exerciseMinutes,
    waterIntake,
    currentMood,
    sleepHours
  });

  // Calculate character progression
  const totalLogs = allLogs.length;
  const characterProgression = calculateCharacterProgression(totalLogs, streak);

  // Get conversation count for today
  const conversationMessages = await ChatMessage.countDocuments({
    userId,
    sender: 'user',
    createdAt: { $gte: date, $lt: tomorrow }
  });

  // Count food photos
  const foodPhotos = todayLogs.filter(log => 
    log.type === 'food' && log.data?.hasPhoto
  ).length;

  // Create or update dashboard stats
  const statsData = {
    userId,
    date,
    healthLevel,
    totalHealthLogs: totalLogs,
    dailyHealthLogs: todayLogs.length,
    currentStreak: streak,
    longestStreak: streak, // TODO: Calculate actual longest streak
    consistencyScore: calculateConsistencyScore(allLogs),
    dailyCalories,
    calorieGoal: user?.healthGoals?.includes('weight_loss') ? 1800 : 2000,
    calorieProgress: Math.round((dailyCalories / 2000) * 100),
    currentWeight,
    exerciseMinutes,
    exerciseGoal: 30,
    waterIntake,
    waterGoal: 8,
    sleepHours,
    sleepGoal: 8,
    currentMood: currentMood as any,
    moodScore: getMoodScore(currentMood),
    characterLevel: characterProgression.level,
    experiencePoints: characterProgression.experience,
    experienceToNextLevel: characterProgression.expToNext,
    conversationMessages,
    foodPhotos,
    newAchievements: 0, // TODO: Calculate new achievements
    totalAchievements: await Achievement.countDocuments({ userId, isCompleted: true })
  };

  return await DashboardStats.findOneAndUpdate(
    { userId, date },
    statsData,
    { upsert: true, new: true }
  );
}

// Helper functions
function calculateStreak(logs: any[]): number {
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
  for (let i = 0; i < 365; i++) { // Check up to 1 year
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

function calculateHealthLevel(metrics: {
  dailyLogs: number;
  exerciseMinutes: number;
  waterIntake: number;
  currentMood: string;
  sleepHours?: number;
}): number {
  let score = 20; // Base score

  // Daily logging (0-25 points)
  score += Math.min(metrics.dailyLogs * 5, 25);

  // Exercise (0-20 points)
  score += Math.min(metrics.exerciseMinutes, 20);

  // Water intake (0-15 points)
  score += Math.min((metrics.waterIntake / 8) * 15, 15);

  // Mood bonus (0-15 points)
  const moodScore = metrics.currentMood === 'happy' ? 15 :
                   metrics.currentMood === 'excited' ? 12 :
                   metrics.currentMood === 'neutral' ? 8 :
                   metrics.currentMood === 'anxious' ? 5 : 3;
  score += moodScore;

  // Sleep bonus (0-15 points)
  if (metrics.sleepHours) {
    const sleepScore = metrics.sleepHours >= 7 && metrics.sleepHours <= 9 ? 15 :
                      metrics.sleepHours >= 6 && metrics.sleepHours <= 10 ? 10 : 5;
    score += sleepScore;
  }

  return Math.min(Math.max(score, 0), 100);
}

function calculateCharacterProgression(totalLogs: number, streak: number) {
  const baseExp = totalLogs * 10;
  const streakBonus = streak * 25;
  const totalExp = baseExp + streakBonus;
  
  const level = Math.floor(totalExp / 100) + 1;
  const experience = totalExp % 100;
  const expToNext = 100 - experience;
  
  return { level, experience, expToNext };
}

function calculateConsistencyScore(logs: any[]): number {
  if (logs.length === 0) return 0;
  
  const last30Days = 30;
  const daysWithLogs = new Set();
  const cutoffDate = new Date(Date.now() - last30Days * 24 * 60 * 60 * 1000);
  
  logs.forEach(log => {
    if (new Date(log.date) >= cutoffDate) {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      daysWithLogs.add(logDate.getTime());
    }
  });
  
  return Math.round((daysWithLogs.size / last30Days) * 100);
}

function getMoodScore(mood: string): number {
  switch (mood) {
    case 'happy': return 9;
    case 'excited': return 8;
    case 'neutral': return 5;
    case 'anxious': return 3;
    case 'sad': return 2;
    default: return 5;
  }
}

export default router;