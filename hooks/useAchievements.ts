import { useState, useEffect } from 'react';
import { achievementsAPI } from '@/lib/api';

interface Achievement {
  _id: string;
  type: 'streak' | 'logs_count' | 'conversation' | 'food_tracking' | 'exercise' | 'weight_goal' | 'custom';
  title: string;
  description: string;
  icon: string;
  experiencePoints: number;
  requirement: {
    target: number;
    current: number;
    unit: string;
  };
  isCompleted: boolean;
  completedAt?: Date;
  category: 'health' | 'social' | 'progress' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  createdAt: Date;
  updatedAt: Date;
}

interface AchievementStats {
  totalAchievements: number;
  completedAchievements: number;
  pendingAchievements: number;
  recentCompleted: number;
  totalExperience: number;
  completionRate: number;
}

export function useAchievements(currentUser: any) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementStats, setAchievementStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const loadAchievements = async (status?: 'completed' | 'pending') => {
    if (!currentUser) return;

    try {
      setError(null);
      const response = await achievementsAPI.getAchievements(status);
      
      if (response.success) {
        setAchievements(response.data);
      }
    } catch (err) {
      console.error('Failed to load achievements:', err);
      setError('実績データの読み込みに失敗しました');
    }
  };

  const loadAchievementStats = async () => {
    if (!currentUser) return;

    try {
      const response = await achievementsAPI.getAchievementStats();
      
      if (response.success) {
        setAchievementStats(response.data);
      }
    } catch (err) {
      console.error('Failed to load achievement stats:', err);
      // Provide fallback stats
      setAchievementStats({
        totalAchievements: 0,
        completedAchievements: 0,
        pendingAchievements: 0,
        recentCompleted: 0,
        totalExperience: 0,
        completionRate: 0
      });
    }
  };

  const initializeAchievements = async () => {
    if (!currentUser || initialized) return;

    try {
      const response = await achievementsAPI.initializeAchievements();
      
      if (response.success) {
        setInitialized(true);
        // Reload achievements after initialization
        await loadAchievements();
        await loadAchievementStats();
      }
    } catch (err) {
      console.error('Failed to initialize achievements:', err);
      // Don't set error here as this is optional
    }
  };

  const checkProgress = async () => {
    if (!currentUser) return [];

    try {
      const response = await achievementsAPI.checkProgress();
      
      if (response.success && response.newlyCompleted.length > 0) {
        // Show achievement completion notifications
        response.newlyCompleted.forEach((achievement: any) => {
          // console.log(`🎉 Achievement unlocked: ${achievement.title}`);
          // You can add toast notifications here when the toast system is working
        });
        
        // Reload achievements to get updated progress
        await loadAchievements();
        await loadAchievementStats();
        return response.newlyCompleted;
      }
      
      return [];
    } catch (err) {
      console.error('Failed to check achievement progress:', err);
      return [];
    }
  };

  const getCompletedAchievements = () => {
    return achievements.filter(achievement => achievement.isCompleted);
  };

  const getPendingAchievements = () => {
    return achievements.filter(achievement => !achievement.isCompleted);
  };

  const getRecentAchievements = (days: number = 7) => {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return achievements.filter(achievement => 
      achievement.isCompleted && 
      achievement.completedAt && 
      new Date(achievement.completedAt) >= cutoffDate
    );
  };

  const getAchievementsByCategory = (category: string) => {
    return achievements.filter(achievement => achievement.category === category);
  };

  const getAchievementProgress = (achievement: Achievement) => {
    if (achievement.isCompleted) return 100;
    return Math.min((achievement.requirement.current / achievement.requirement.target) * 100, 100);
  };

  useEffect(() => {
    const loadAllData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // Initialize achievements if this is the first time
      await initializeAchievements();
      
      // Load current achievements and stats
      await Promise.all([
        loadAchievements(),
        loadAchievementStats()
      ]);
      
      setLoading(false);
    };

    loadAllData();
  }, [currentUser]);

  // Listen for health data updates to check achievement progress
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'health_data_updated') {
        // Check for new achievements after health data updates
        setTimeout(async () => {
          const newlyCompleted = await checkProgress();
          if (newlyCompleted.length > 0) {
            // console.log('🎉 New achievements completed:', newlyCompleted);
            // Trigger character refresh for new achievements
            try {
              const { triggerCharacterRefresh } = await import('@/lib/characterHelpers');
              triggerCharacterRefresh();
            } catch (error) {
              console.warn('Failed to trigger character refresh after achievements:', error);
            }
          }
        }, 1000); // Small delay to allow backend processing
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    achievements,
    achievementStats,
    loading,
    error,
    loadAchievements,
    loadAchievementStats,
    initializeAchievements,
    checkProgress,
    getCompletedAchievements,
    getPendingAchievements,
    getRecentAchievements,
    getAchievementsByCategory,
    getAchievementProgress
  };
}