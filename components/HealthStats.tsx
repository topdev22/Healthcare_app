import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Scale, Smile, Camera } from 'lucide-react';
import { MoodIcons } from '@/components/CharacterFaces';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/contexts/AuthContext';

interface HealthData {
  weight?: number;
  mood: 'happy' | 'neutral' | 'sad' | 'anxious' | 'excited';
  calories?: number;
  date: string;
}

interface HealthStatsProps {
  recentData?: HealthData[]; // Optional for backward compatibility
  onLogHealth: () => void;
  onTakePhoto: () => void;
}

export default function HealthStats({ recentData: overrideRecentData, onLogHealth, onTakePhoto }: HealthStatsProps) {
  const { currentUser } = useAuth();
  const { dashboardStats, loading } = useDashboard(currentUser);
  
  // Use override data or transform dashboard stats to expected format
  const recentData = overrideRecentData || (dashboardStats ? [{
    weight: dashboardStats.currentWeight,
    mood: dashboardStats.currentMood,
    calories: dashboardStats.dailyCalories,
    date: new Date().toISOString()
  }] : []);
  
  // Ensure recentData is always an array
  const safeRecentData = Array.isArray(recentData) ? recentData : [];
  const today = safeRecentData[0];
  
  // Calculate statistics from dashboard data if available
  const weekAvg = dashboardStats?.currentWeight || 
    (safeRecentData.slice(0, 7).reduce((acc, day) => acc + (day.weight || 0), 0) / 
     Math.max(safeRecentData.slice(0, 7).filter(d => d.weight).length, 1));
  
  const weeklyLogs = dashboardStats?.dailyHealthLogs || safeRecentData.length;
  const waterProgress = dashboardStats && dashboardStats.waterGoal > 0 ? Math.round((dashboardStats.waterIntake / dashboardStats.waterGoal*1000) * 100) : 0;
  
  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'happy': return <MoodIcons.happy size={16} />;
      case 'neutral': return <MoodIcons.neutral size={16} />;
      case 'sad': return <MoodIcons.sad size={16} />;
      case 'anxious': return <MoodIcons.anxious size={16} />;
      case 'excited': return <MoodIcons.excited size={16} />;
      default: return <MoodIcons.neutral size={16} />;
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'happy': return 'bg-health-green text-white';
      case 'excited': return 'bg-wellness-amber text-white';
      case 'neutral': return 'bg-gray-500 text-white';
      case 'anxious': return 'bg-orange-500 text-white';
      case 'sad': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading && !dashboardStats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="h-6 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              </div>
              <div className="h-10 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Today's Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-health-green" />
            今日の健康状態
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">気分</span>
            <Badge className={cn("flex items-center gap-1", getMoodColor(today?.mood || 'neutral'))}>
              {getMoodIcon(today?.mood || 'neutral')} {today?.mood === 'happy' ? '幸せ' : today?.mood === 'sad' ? '悲しい' : today?.mood === 'excited' ? '興奮' : today?.mood === 'anxious' ? '不安' : today?.mood || '未記録'}
            </Badge>
          </div>
          
          {today?.weight && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">体重</span>
              <div className="flex items-center gap-1">
                <Scale className="w-4 h-4 text-health-blue" />
                <span className="font-medium">{today.weight}kg</span>
              </div>
            </div>
          )}
          
          {today?.calories && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">カロリー</span>
              <span className="font-medium">{today.calories} cal</span>
            </div>
          )}
          
          <button
            onClick={onLogHealth}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            健康データを記録
          </button>
        </CardContent>
      </Card>

      {/* Weekly Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Smile className="w-5 h-5 text-character-primary" />
            今週の記録
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">現在の体重</span>
            <span className="font-medium">
              {dashboardStats?.currentWeight ? `${dashboardStats.currentWeight.toFixed(1)}kg` : '未記録'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">今日の記録数</span>
            <span className="font-medium">{weeklyLogs}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">連続記録</span>
            <span className="font-medium">{dashboardStats?.currentStreak || 0}日</span>
          </div>

          {dashboardStats && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">水分摂取</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {dashboardStats.waterIntake}/{dashboardStats.waterGoal*1000 || 0}ml
                </span>
                <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-health-blue transition-all duration-300"
                    style={{ width: `${Math.min(waterProgress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          
          <div>
            <span className="text-sm text-muted-foreground mb-2 block">今日の気分</span>
            <div className="flex items-center gap-2">
              {getMoodIcon(today?.mood || 'neutral')}
              <span className="text-sm font-medium">
                {today?.mood === 'happy' ? '幸せ' : 
                 today?.mood === 'sad' ? '悲しい' : 
                 today?.mood === 'excited' ? '興奮' : 
                 today?.mood === 'anxious' ? '不安' : 
                 today?.mood || '未記録'}
              </span>
            </div>
          </div>
          
          <button
            onClick={onTakePhoto}
            className="w-full py-2 px-4 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            食事写真を記録
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
