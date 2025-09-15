import { useState, useEffect } from 'react';
import { healthAPI, userAPI, chatAPI, socketManager } from '@/lib/api';

interface CharacterData {
  mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'anxious' | 'sleeping';
  healthLevel: number; // 0-100
  level: number;
  experience: number;
  streak: number;
  isInteracting?: boolean;
}

interface HealthStats {
  totalLogs: number;
  weeklyLogs: number;
  recentMood: 'happy' | 'neutral' | 'sad' | 'excited' | 'anxious';
  averageWeight?: number;
  exerciseCount: number;
  waterIntake: number;
  sleepHours?: number;
}

interface UserProfile {
  displayName: string;
  age?: number;
  activityLevel?: string;
  healthGoals?: string[];
}

export function useCharacterData(currentUser: any) {
  const [characterData, setCharacterData] = useState<CharacterData>({
    mood: 'happy',
    healthLevel: 75,
    level: 1,
    experience: 0,
    streak: 0
  });
  const [healthStats, setHealthStats] = useState<HealthStats | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate health level based on various factors
  const calculateHealthLevel = (stats: HealthStats, profile: UserProfile) => {
    let score = 50; // Base score

    // Logging consistency (0-25 points)
    const loggingConsistency = Math.min(stats.weeklyLogs * 3.5, 25);
    score += loggingConsistency;

    // Exercise activity (0-20 points)
    const exerciseScore = Math.min(stats.exerciseCount * 4, 20);
    score += exerciseScore;

    // Water intake (0-15 points) - assuming goal is 8 glasses per day
    const waterScore = Math.min((stats.waterIntake / 8) * 15, 15);
    score += waterScore;

    // Sleep quality (0-15 points) - assuming 7-9 hours is optimal
    if (stats.sleepHours) {
      const sleepScore = stats.sleepHours >= 7 && stats.sleepHours <= 9 ? 15 : 
                        stats.sleepHours >= 6 && stats.sleepHours <= 10 ? 10 : 5;
      score += sleepScore;
    }

    // Recent activity (0-15 points)
    const recentActivityScore = Math.min(stats.totalLogs > 0 ? 15 : 0, 15);
    score += recentActivityScore;

    // Mood bonus (0-10 points)
    const moodBonus = stats.recentMood === 'happy' ? 10 : 
                     stats.recentMood === 'excited' ? 8 :
                     stats.recentMood === 'neutral' ? 5 : 2;
    score += moodBonus;

    return Math.min(Math.max(score, 0), 100);
  };

  // Calculate character level and experience (including chat activity and achievements)
  const calculateLevelAndExperience = (healthLevel: number, totalLogs: number, streak: number, chatMessages: number = 0, achievementExp: number = 0) => {
    const baseExp = totalLogs * 10; // 10 XP per health log
    const streakBonus = streak * 25; // 25 XP per streak day
    const chatExp = chatMessages * 2; // 2 XP per chat message
    const healthBonus = Math.floor(healthLevel / 10) * 5; // Health bonus
    const achievementBonus = achievementExp; // Full achievement experience
    const totalExp = baseExp + streakBonus + chatExp + healthBonus + achievementBonus;
    
    const level = Math.floor(totalExp / 100) + 1;
    const currentLevelExp = totalExp % 100;
    const expToNext = 100 - currentLevelExp;
    
    return { 
      level, 
      experience: currentLevelExp,
      expToNext,
      totalExp
    };
  };

  // Get mood from recent health logs
  const getMoodFromLogs = (logs: any[]) => {
    const moodLogs = logs.filter(log => log.type === 'mood');
    if (moodLogs.length === 0) return 'neutral';
    
    const recentMood = moodLogs[0]?.data?.mood || 'neutral';
    return recentMood as 'happy' | 'neutral' | 'sad' | 'excited' | 'anxious';
  };

  // Calculate streak days
  const calculateStreak = (logs: any[]) => {
    if (logs.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Group logs by date
    const logsByDate = new Map();
    logs.forEach(log => {
      const logDate = new Date(log.date).toDateString();
      if (!logsByDate.has(logDate)) {
        logsByDate.set(logDate, []);
      }
      logsByDate.get(logDate).push(log);
    });

    // Check consecutive days with logs
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const checkDate = new Date(today.getTime() - (i * oneDayMs));
      const dateString = checkDate.toDateString();
      
      if (logsByDate.has(dateString)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const loadCharacterData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch data in parallel
      const [healthStatsResponse, userProfileResponse] = await Promise.all([
        healthAPI.getHealthStats('30days'), // Get health statistics from backend
        userAPI.getProfile()
      ]);

      const statsData = healthStatsResponse.data;
      const profile = userProfileResponse.data;

      const stats: HealthStats = {
        totalLogs: statsData.totalLogs,
        weeklyLogs: statsData.weeklyLogs,
        recentMood: statsData.recentMood as 'happy' | 'neutral' | 'sad' | 'excited' | 'anxious',
        averageWeight: statsData.averageWeight,
        exerciseCount: statsData.exerciseCount,
        waterIntake: statsData.waterIntake,
        sleepHours: statsData.sleepHours
      };

      // Get streak from backend
      const streak = statsData.streak || 0;

      // Calculate character data
      const healthLevel = calculateHealthLevel(stats, profile);
      // Note: Chat messages count and achievement experience should come from backend stats in real implementation
      const { level, experience } = calculateLevelAndExperience(healthLevel, stats.totalLogs, streak, 0, 0);

      const newCharacterData: CharacterData = {
        mood: stats.recentMood,
        healthLevel,
        level,
        experience,
        streak
      };

      setCharacterData(newCharacterData);
      setHealthStats(stats);
      setUserProfile(profile);

    } catch (err) {
      console.error('Failed to load character data:', err);
      setError('キャラクターデータの読み込みに失敗しました');
      
      // Fallback to default data
      setCharacterData({
        mood: 'happy',
        healthLevel: 75,
        level: 1,
        experience: 0,
        streak: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Update character interaction state
  const setInteracting = (isInteracting: boolean) => {
    setCharacterData(prev => ({ ...prev, isInteracting }));
  };

  // Trigger interaction when health data is updated
  const triggerInteraction = () => {
    setInteracting(true);
    setTimeout(() => setInteracting(false), 2000);
  };

  useEffect(() => {
    loadCharacterData();
  }, [currentUser]);

  // Set up real-time updates for character data
  useEffect(() => {
    if (!currentUser) return;

    // Connect to WebSocket for real-time updates
    const socket = socketManager.connect();
    
    // Listen for health data updates and refresh character data
    healthAPI.onHealthDataUpdate((data: any) => {
      // console.log('🔔 Character: Health data update received:', data);
      loadCharacterData();
      triggerInteraction(); // Show character interaction when data updates
    });

    // Listen for new health logs and refresh character data
    healthAPI.onNewHealthLog((logData: any) => {
      // console.log('🔔 Character: New health log received:', logData);
      loadCharacterData();
      triggerInteraction(); // Character reacts to new logs
    });

    // Listen for health log updates and refresh character data
    healthAPI.onHealthLogUpdated((logData: any) => {
      // console.log('🔔 Character: Health log updated:', logData);
      loadCharacterData();
      triggerInteraction(); // Character reacts to updates
    });

    // Listen to storage events as fallback
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'health_data_updated') {
        loadCharacterData();
        triggerInteraction();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      socket.off('health_data_updated');
      socket.off('new_health_log');
      socket.off('health_log_updated');
    };
  }, [currentUser]);

  return {
    characterData,
    healthStats,
    userProfile,
    loading,
    error,
    loadCharacterData,
    setInteracting,
    triggerInteraction
  };
}