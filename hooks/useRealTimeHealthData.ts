import { useState, useEffect, useCallback } from 'react';
import { healthAPI, dashboardAPI, socketManager, socketEvents } from '@/lib/api';
import { retryApiCall, handleAndroidApiError, logAndroidError, isAndroidApp } from '@/lib/androidUtils';

interface HealthData {
  weight?: number;
  mood: 'happy' | 'neutral' | 'sad' | 'anxious' | 'excited';
  calories?: number;
  date: string;
}

interface RealTimeHealthStats {
  currentWeight?: number;
  currentMood: 'happy' | 'neutral' | 'sad' | 'anxious' | 'excited';
  dailyCalories: number;
  waterIntake: number;
  waterGoal: number;
  dailySteps: number;
  stepsGoal: number;
  dailyHealthLogs: number;
  currentStreak: number;
  healthLevel: number;
  lastUpdated: string;
}

export function useRealTimeHealthData(currentUser: any) {
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [realTimeStats, setRealTimeStats] = useState<RealTimeHealthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load health data from API
  const loadHealthData = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      // Use retry mechanism for Android stability
      const [dashboardResponse, healthLogsResponse] = await retryApiCall(async () => {
        return Promise.all([
          dashboardAPI.getDashboardStats(),
          healthAPI.getHealthLogs(50, 0)
        ]);
      }, isAndroidApp() ? 3 : 2); // More retries for Android

      const dashboardData = dashboardResponse.data;
      const healthLogs = healthLogsResponse.data || [];
      
      // Transform health logs for compatibility with existing components
      const transformedHealthData: HealthData[] = healthLogs.map((log: any) => ({
        weight: log.type === 'weight' ? log.data?.weight : undefined,
        mood: log.type === 'mood' ? log.data?.mood || 'neutral' : 'neutral',
        calories: log.type === 'food' ? log.data?.calories : undefined,
        date: log.date
      })).filter((log: HealthData) => log.weight || log.calories || log.mood !== 'neutral');

      setHealthData(transformedHealthData);

      // Use real dashboard data for statistics
      const stats: RealTimeHealthStats = {
        currentWeight: dashboardData.currentWeight,
        currentMood: dashboardData.currentMood || 'neutral',
        dailyCalories: dashboardData.dailyCalories || 0,
        waterIntake: dashboardData.waterIntake || 0, // Real water intake from database
        waterGoal: dashboardData.waterGoal || 2000, // Real or default water goal
        dailySteps: dashboardData.dailySteps || 0, // Real steps from database
        stepsGoal: dashboardData.stepsGoal || 10000, // Real or default steps goal
        dailyHealthLogs: dashboardData.dailyHealthLogs || 0,
        currentStreak: dashboardData.currentStreak || 0,
        healthLevel: dashboardData.healthLevel || 50, // Real health level calculation
        lastUpdated: new Date().toISOString()
      };

      setRealTimeStats(stats);
      setLastUpdate(new Date());
    } catch (err: any) {
      // Log error for Android debugging
      logAndroidError('useRealTimeHealthData.loadHealthData', err);
      
      // Use Android-optimized error handling
      const errorMessage = isAndroidApp() ?
        handleAndroidApiError(err) :
        (err.message || 'リアルタイムデータの読み込みに失敗しました');
      
      setError(errorMessage);
      
      // Use minimal fallback data with clear indication of no data
      const fallbackData: HealthData[] = [];
      
      setHealthData(fallbackData);
      setRealTimeStats({
        currentWeight: undefined,
        currentMood: 'neutral',
        dailyCalories: 0,
        waterIntake: 0, // Start with 0 when no data available
        waterGoal: 2000, // Keep default goal for UI display
        dailySteps: 0, // Start with 0 when no data available
        stepsGoal: 10000, // Keep default goal for UI display
        dailyHealthLogs: 0,
        currentStreak: 0,
        healthLevel: 0, // 0 indicates no data/connectivity issues
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Calculate current streak
  const calculateStreak = (data: HealthData[]): number => {
    if (!data.length) return 0;
    
    let streak = 0;
    const today = new Date();
    const sortedData = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    for (let i = 0; i < sortedData.length; i++) {
      const logDate = new Date(sortedData[i].date);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (logDate.toDateString() === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Set up real-time updates
  useEffect(() => {
    if (!currentUser) return;

    // Initial load
    loadHealthData();

    // Connect to WebSocket for real-time updates
    const socket = socketEvents.connect();
    
    // Subscribe to health data updates
    healthAPI.subscribeToHealthUpdates();
    
    // Listen for health data updates
    healthAPI.onHealthDataUpdate((data: any) => {
      // console.log('🔔 Real-time health data update received:', data);
      loadHealthData(); // Reload both health logs and dashboard stats
    });

    // Listen for new health logs
    healthAPI.onNewHealthLog((logData: any) => {
      // console.log('🔔 New health log received:', logData);
      // Add to local state immediately for instant UI update
      setHealthData(prev => [logData, ...prev]);
      // Trigger full refresh to update calculated stats
      loadHealthData();
    });

    // Listen for health log updates
    healthAPI.onHealthLogUpdated((logData: any) => {
      // console.log('🔔 Health log updated:', logData);
      // Update local state immediately
      setHealthData(prev =>
        prev.map(log =>
          log.date === logData.date ? logData : log
        )
      );
      // Trigger full refresh to recalculate stats
      loadHealthData();
    });

    // Set up polling as fallback (every 30 seconds)
    const pollInterval = setInterval(() => {
      if (socketManager.isSocketConnected()) {
        // If WebSocket is connected, we don't need polling
        return;
      }
      // console.log('📡 Polling for health data updates...');
      loadHealthData();
    }, 30000);

    // Cleanup
    return () => {
      clearInterval(pollInterval);
      healthAPI.unsubscribeFromHealthUpdates();
      socket.off('health_data_updated');
      socket.off('new_health_log');
      socket.off('health_log_updated');
    };
  }, [currentUser, loadHealthData]);

  // Manual refresh function
  const refreshData = useCallback(() => {
    loadHealthData();
  }, [loadHealthData]);

  // Simulate real-time update for testing (remove in production)
  const simulateUpdate = useCallback(() => {
    const newWeight = Math.random() * 2 + 69; // Random weight between 69-71
    const moods: ('happy' | 'neutral' | 'sad' | 'anxious' | 'excited')[] = ['happy', 'neutral', 'sad', 'anxious', 'excited'];
    const newMood = moods[Math.floor(Math.random() * moods.length)];
    const newCalories = Math.floor(Math.random() * 500) + 1500; // Random calories between 1500-2000
    
    const newLog: HealthData = {
      weight: parseFloat(newWeight.toFixed(1)),
      mood: newMood,
      calories: newCalories,
      date: new Date().toISOString()
    };
    
    setHealthData(prev => [newLog, ...prev]);
    
    // Update real-time stats
    if (realTimeStats) {
      const newSteps = Math.floor(Math.random() * 500) + 100;
      const newWaterIntake = Math.min(realTimeStats.waterIntake + 250, realTimeStats.waterGoal); // Add 250ml
      
      setRealTimeStats(prev => prev ? {
        ...prev,
        currentWeight: newLog.weight,
        currentMood: newLog.mood,
        dailyCalories: prev.dailyCalories + newCalories,
        waterIntake: newWaterIntake,
        dailySteps: prev.dailySteps + newSteps,
        healthLevel: Math.min(prev.healthLevel + Math.floor(Math.random() * 5), 100), // Slight health level increase
        lastUpdated: new Date().toISOString()
      } : null);
    }
    
    setLastUpdate(new Date());
  }, [realTimeStats]);

  // Get today's data
  const getTodayData = useCallback((): HealthData | null => {
    const today = new Date().toDateString();
    return healthData.find(log => 
      new Date(log.date).toDateString() === today
    ) || null;
  }, [healthData]);

  // Get recent data (last 7 days)
  const getRecentData = useCallback((): HealthData[] => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return healthData.filter(log => 
      new Date(log.date) >= sevenDaysAgo
    );
  }, [healthData]);

  return {
    healthData,
    realTimeStats,
    todayData: getTodayData(),
    recentData: getRecentData(),
    loading,
    error,
    lastUpdate,
    refreshData,
    loadHealthData,
    simulateUpdate
  };
}
