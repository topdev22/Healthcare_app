import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Scale, Smile, Camera, RefreshCw, Activity, Utensils, Droplet } from 'lucide-react';
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
      case 'sad': return 'bg-blue-400 text-white';
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
    <div className="space-y-4 sm:space-y-6">
      {/* Health Status Overview Banner */}
      <Card className="glass border border-white/30 shadow-xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-health-green to-health-blue flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">今日の活動状況</h3>
                <p className="text-sm text-muted-foreground">健康記録で成長しましょう</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-health-green">{realTimeStats?.currentStreak || 0}</div>
                <div className="text-xs text-muted-foreground">連続記録日数</div>
              </div>
              <div className="w-2 h-2 bg-health-green rounded-full animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {error && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-orange-600" />
              <p className="text-sm text-orange-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Today's Health Dashboard */}
        <Card className="glass border border-white/30 shadow-lg">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 text-health-green" />
              今日の健康指標
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mood Status */}
            <div className="p-3 glass rounded-lg border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">気分・メンタル</span>
                <Badge className={cn("flex items-center gap-1.5", getMoodColor(today?.mood || 'neutral'))}>
                  {getMoodIcon(today?.mood || 'neutral')}
                  {today?.mood === 'happy' ? '幸せ' : today?.mood === 'sad' ? '悲しい' : today?.mood === 'excited' ? '興奮' : today?.mood === 'anxious' ? '不安' : today?.mood || '未記録'}
                </Badge>
              </div>
            </div>
            
            {/* Physical Metrics */}
            <div className="space-y-3">
              {today?.weight && (
                <div className="p-3 glass rounded-lg border border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-health-blue" />
                      <span className="text-sm font-medium">体重</span>
                    </div>
                    <span className="text-lg font-bold text-health-blue">{today.weight}kg</span>
                  </div>
                </div>
              )}
              
              {today?.calories && (
                <div className="p-3 glass rounded-lg border border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-wellness-amber" />
                      <span className="text-sm font-medium">カロリー</span>
                    </div>
                    <span className="text-lg font-bold text-wellness-amber">{today.calories} cal</span>
                  </div>
                </div>
              )}

              {realTimeStats && (
                <div className="p-3 glass rounded-lg border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">水分摂取</span>
                    </div>
                    <span className="text-sm font-medium text-blue-500">
                      {realTimeStats.waterIntake}/{realTimeStats.waterGoal || 0}ml
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                      style={{ width: `${Math.min(waterProgress, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <Button
              onClick={onLogHealth}
              className="w-full bg-gradient-to-r from-health-green to-health-green/80 hover:from-health-green/90 hover:to-health-green/70 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              size="lg"
            >
              <Heart className="w-4 h-4 mr-2" />
              健康データを記録
            </Button>
          </CardContent>
        </Card>

        {/* Weekly Progress & Activities */}
        <Card className="glass border border-white/30 shadow-lg">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-character-primary" />
              週間パフォーマンス
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 glass rounded-lg border border-white/20">
                <div className="text-xl font-bold text-health-green">{realTimeStats?.currentWeight ? `${realTimeStats.currentWeight.toFixed(1)}` : '--'}</div>
                <div className="text-xs text-muted-foreground">現在体重(kg)</div>
              </div>
              <div className="text-center p-3 glass rounded-lg border border-white/20">
                <div className="text-xl font-bold text-character-primary">{weeklyLogs}</div>
                <div className="text-xs text-muted-foreground">今週の記録</div>
              </div>
              <div className="text-center p-3 glass rounded-lg border border-white/20">
                <div className="text-xl font-bold text-wellness-amber">{realTimeStats?.currentStreak || 0}</div>
                <div className="text-xs text-muted-foreground">連続記録日</div>
              </div>
              <div className="text-center p-3 glass rounded-lg border border-white/20">
                <div className="text-xl font-bold text-health-blue">{waterProgress}%</div>
                <div className="text-xs text-muted-foreground">水分達成率</div>
              </div>
            </div>

            {/* Today's Mood */}
            <div className="p-3 glass rounded-lg border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">今日の気分</span>
                <Badge variant="outline" className="text-xs">
                  {today?.mood ? '記録済み' : '未記録'}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  {getMoodIcon(today?.mood || 'neutral')}
                </div>
                <span className="text-base font-medium">
                  {today?.mood === 'happy' ? '幸せ' :
                   today?.mood === 'sad' ? '悲しい' :
                   today?.mood === 'excited' ? '興奮' :
                   today?.mood === 'anxious' ? '不安' :
                   today?.mood || '未記録'}
                </span>
              </div>
            </div>
            
            <Button
              onClick={onTakePhoto}
              variant="outline"
              className="w-full glass border-health-blue/30 hover:border-health-blue/50 hover:bg-health-blue/10 transition-all duration-300 hover:scale-105"
              size="lg"
            >
              <Camera className="w-4 h-4 mr-2" />
              食事写真を記録
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Enhanced Steps Display */}
      <StepsDisplay
        dailySteps={realTimeStats?.dailySteps || 0}
        stepsGoal={realTimeStats?.stepsGoal || 10000}
        enableRealTimeTracking={true}
        className="glass border border-white/30 shadow-lg"
      />
    </div>
  );
}
