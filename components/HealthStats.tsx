import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Scale, Smile, Camera, RefreshCw } from 'lucide-react';
import { MoodIcons } from '@/components/CharacterFaces';
import { cn } from '@/lib/utils';
import { useRealTimeHealthData } from '@/hooks/useRealTimeHealthData';
import { useAuth } from '@/contexts/AuthContext';
import StepsDisplay from '@/components/StepsDisplay';

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
  const { 
    realTimeStats, 
    todayData, 
    recentData, 
    loading, 
    error, 
    lastUpdate, 
    refreshData,
    simulateUpdate
  } = useRealTimeHealthData(currentUser);
  
  // Use override data or real-time data
  const displayData = overrideRecentData || recentData;
  const today = todayData || displayData[0];
  
  // Calculate statistics from real-time data
  const weekAvg = realTimeStats?.currentWeight || 
    (displayData.slice(0, 7).reduce((acc, day) => acc + (day.weight || 0), 0) / 
     Math.max(displayData.slice(0, 7).filter(d => d.weight).length, 1));
  
  const weeklyLogs = realTimeStats?.dailyHealthLogs || displayData.length;
  const waterProgress = realTimeStats && realTimeStats.waterGoal > 0 ? 
    Math.round((realTimeStats.waterIntake / realTimeStats.waterGoal) * 100) : 0;
  
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

  if (loading && !realTimeStats) {
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
    <div className="space-y-4">
      {/* Real-time indicator and refresh button */}
      {/* <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">
            リアルタイム更新中 - 最終更新: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            更新
          </button>
          <button
            onClick={simulateUpdate}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            🧪 テスト更新
          </button>
        </div>
      </div> */}
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
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
              {realTimeStats?.currentWeight ? `${realTimeStats.currentWeight.toFixed(1)}kg` : '未記録'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">今日の記録数</span>
            <span className="font-medium">{weeklyLogs}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">連続記録</span>
            <span className="font-medium">{realTimeStats?.currentStreak || 0}日</span>
          </div>

          {realTimeStats && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">水分摂取</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {realTimeStats.waterIntake}/{realTimeStats.waterGoal || 0}ml
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
      
      {/* Steps Display */}
      <div className="mt-4">
        <StepsDisplay 
          dailySteps={realTimeStats?.dailySteps || 0}
          stepsGoal={realTimeStats?.stepsGoal || 10000}
          enableRealTimeTracking={true}
        />
      </div>

      {/* Development   Links */}
      {/* {typeof window !== 'undefined' && (
        <div className="mt-4">
          
          {!window.navigator.userAgent.toLowerCase().match(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-blue-800 font-medium">PC開発環境</span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                歩数カウンターのテスト機能が利用できます。
                <a 
                  href="/pc-testing" 
                  className="underline ml-1 hover:text-blue-900"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  テスト画面を開く
                </a>
              </p>
            </div>
          )}
          
          
          {window.navigator.userAgent.toLowerCase().match(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-800 font-medium">モバイルデバッグ</span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                歩数カウンターが正常に動作しない場合はデバッグ画面をご確認ください。
                <a 
                  href="/mobile-debug" 
                  className="underline ml-1 hover:text-green-900"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  デバッグ画面を開く
                </a>
              </p>
            </div>
          )}
        </div>
      )} */}
    </div>
  );
}
