import { useState, useEffect, useCallback } from 'react';
import { healthAPI, socketManager, socketEvents } from '@/lib/api';

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
  dailyHealthLogs: number;
  currentStreak: number;
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

      const response = await healthAPI.getHealthLogs(50, 0);
      const data = response.data || [];
      
      // If no data from API, use sample data for demonstration
      const sampleData: HealthData[] = data.length > 0 ? data : [
        {
          weight: 70.2,
          mood: 'happy',
          calories: 1850,
          date: new Date().toISOString()
        },
        {
          weight: 70.5,
          mood: 'neutral',
          calories: 1720,
          date: new Date(Date.now() - 24*60*60*1000).toISOString()
        },
        {
          weight: 70.8,
          mood: 'excited',
          calories: 1950,
          date: new Date(Date.now() - 2*24*60*60*1000).toISOString()
        }
      ];
      
      setHealthData(sampleData);

      // Calculate real-time stats from the data
      const today = new Date().toDateString();
      const todayData = sampleData.filter(log => 
        new Date(log.date).toDateString() === today
      );

      const latestData = sampleData[0]; // Most recent entry
      
      const stats: RealTimeHealthStats = {
        currentWeight: latestData?.weight,
        currentMood: latestData?.mood || 'neutral',
        dailyCalories: todayData.reduce((sum, log) => sum + (log.calories || 0), 0),
        waterIntake: 1200, // Sample water intake
        waterGoal: 2000, // Default water goal in ml
        dailyHealthLogs: todayData.length,
        currentStreak: calculateStreak(sampleData),
        lastUpdated: new Date().toISOString()
      };

      setRealTimeStats(stats);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to load real-time health data:', err);
      setError('リアルタイムデータの読み込みに失敗しました');
      
      // Use sample data on error
      const fallbackData: HealthData[] = [
        {
          weight: 70.2,
          mood: 'happy',
          calories: 1850,
          date: new Date().toISOString()
        }
      ];
      
      setHealthData(fallbackData);
      setRealTimeStats({
        currentWeight: 70.2,
        currentMood: 'happy',
        dailyCalories: 1850,
        waterIntake: 1200,
        waterGoal: 2000,
        dailyHealthLogs: 1,
        currentStreak: 1,
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
      console.log('🔔 Real-time health data update received:', data);
      loadHealthData(); // Reload data when updates are received
    });

    // Listen for new health logs
    healthAPI.onNewHealthLog((logData: any) => {
      console.log('🔔 New health log received:', logData);
      setHealthData(prev => [logData, ...prev]);
      loadHealthData(); // Reload stats
    });

    // Listen for health log updates
    healthAPI.onHealthLogUpdated((logData: any) => {
      console.log('🔔 Health log updated:', logData);
      setHealthData(prev => 
        prev.map(log => 
          log.date === logData.date ? logData : log
        )
      );
      loadHealthData(); // Reload stats
    });

    // Set up polling as fallback (every 30 seconds)
    const pollInterval = setInterval(() => {
      if (socketManager.isSocketConnected()) {
        // If WebSocket is connected, we don't need polling
        return;
      }
      console.log('📡 Polling for health data updates...');
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
      setRealTimeStats(prev => prev ? {
        ...prev,
        currentWeight: newLog.weight,
        currentMood: newLog.mood,
        dailyCalories: prev.dailyCalories + newCalories,
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
