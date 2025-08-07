import { useState, useEffect } from 'react';
import { dashboardAPI } from '@/lib/api';

interface DashboardStats {
  healthLevel: number;
  totalHealthLogs: number;
  dailyHealthLogs: number;
  currentStreak: number;
  longestStreak: number;
  consistencyScore: number;
  dailyCalories: number;
  calorieGoal: number;
  calorieProgress: number;
  currentWeight?: number;
  weightGoal?: number;
  exerciseMinutes: number;
  exerciseGoal: number;
  waterIntake: number;
  waterGoal: number;
  sleepHours?: number;
  sleepGoal: number;
  currentMood: 'happy' | 'neutral' | 'sad' | 'excited' | 'anxious';
  moodScore: number;
  characterLevel: number;
  experiencePoints: number;
  experienceToNextLevel: number;
  conversationMessages: number;
  foodPhotos: number;
  newAchievements: number;
  totalAchievements: number;
}

interface QuickStats {
  healthLevel: number;
  streakDays: number;
  todayCalories: number;
  characterLevel: number;
}

interface ProgressData {
  characterLevel: number;
  experiencePoints: number;
  experienceToNextLevel: number;
  totalHealthLogs: number;
  totalConversations: number;
  recentAchievements: any[];
  nextLevelProgress: number;
}

export function useDashboard(currentUser: any) {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardStats = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      const response = await dashboardAPI.getDashboardStats();
      if (response.success) {
        setDashboardStats(response.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setError('ダッシュボードデータの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadQuickStats = async () => {
    if (!currentUser) return;

    try {
      const response = await dashboardAPI.getQuickStats();
      if (response.success) {
        setQuickStats(response.data);
      }
    } catch (err) {
      console.error('Failed to load quick stats:', err);
      // Fallback to default values
      setQuickStats({
        healthLevel: 50,
        streakDays: 0,
        todayCalories: 0,
        characterLevel: 1
      });
    }
  };

  const loadProgressData = async () => {
    if (!currentUser) return;

    try {
      const response = await dashboardAPI.getProgress();
      if (response.success) {
        setProgressData(response.data);
      }
    } catch (err) {
      console.error('Failed to load progress data:', err);
      setProgressData({
        characterLevel: 1,
        experiencePoints: 0,
        experienceToNextLevel: 100,
        totalHealthLogs: 0,
        totalConversations: 0,
        recentAchievements: [],
        nextLevelProgress: 0
      });
    }
  };

  const refreshAllData = async () => {
    await Promise.all([
      loadDashboardStats(),
      loadQuickStats(),
      loadProgressData()
    ]);
  };

  useEffect(() => {
    if (currentUser) {
      refreshAllData();
    }
  }, [currentUser]);

  // Listen for health data updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'health_data_updated') {
        refreshAllData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    dashboardStats,
    quickStats,
    progressData,
    loading,
    error,
    refreshAllData,
    loadDashboardStats,
    loadQuickStats,
    loadProgressData
  };
}