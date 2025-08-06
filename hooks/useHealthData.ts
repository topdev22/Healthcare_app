import { useState, useEffect } from 'react';
import { healthAPI } from '@/lib/api';

interface HealthData {
  weight?: number;
  mood: 'happy' | 'neutral' | 'sad' | 'anxious' | 'excited';
  calories?: number;
  date: string;
}

export function useHealthData(currentUser: any) {
  const [healthData, setHealthData] = useState<HealthData[]>([]);

  const loadHealthData = async () => {
    try {
      const response = await healthAPI.getHealthLogs();
      const data = response.data || [];
      setHealthData(data);
    } catch (error) {
      console.error('Health data loading error:', error);
      // エラーの場合はサンプルデータを表示
      setHealthData([
        { mood: 'happy', weight: 70.2, calories: 1850, date: new Date().toISOString() },
        { mood: 'neutral', weight: 70.5, date: new Date(Date.now() - 24*60*60*1000).toISOString() },
      ]);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadHealthData();
    }
  }, [currentUser]);

  return {
    healthData,
    loadHealthData
  };
}