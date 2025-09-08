import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Heart, Clock, Sparkles } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/contexts/AuthContext';

interface QuickStatsCardsProps {
  // Optional props to override data (for testing or specific scenarios)
  healthLevel?: number;
  streakDays?: number;
  todayCalories?: number;
  characterLevel?: number;
}

export default function QuickStatsCards({
  healthLevel: overrideHealthLevel,
  streakDays: overrideStreakDays,
  todayCalories: overrideTodayCalories,
  characterLevel: overrideCharacterLevel
}: QuickStatsCardsProps) {
  const { currentUser } = useAuth();
  const { quickStats, progressData, loading } = useDashboard(currentUser);

  // Use override props or real data
  const healthLevel = overrideHealthLevel !== undefined ? overrideHealthLevel : (quickStats?.healthLevel || 50);
  const streakDays = overrideStreakDays !== undefined ? overrideStreakDays : (quickStats?.streakDays || 0);
  const todayCalories = overrideTodayCalories !== undefined ? overrideTodayCalories : (quickStats?.todayCalories || 0);
  
  // Use the same character level calculation as Character.tsx for consistency
  const getCharacterLevel = () => {
    // if (overrideCharacterLevel !== undefined) return overrideCharacterLevel;
    return healthLevel / 25 + 1;
  };
  const characterLevel = getCharacterLevel();
  const nextLevelProgress = progressData?.nextLevelProgress || 0;

  if (loading && !quickStats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="card-hover">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-muted rounded mx-auto mb-1 sm:mb-2 animate-pulse" />
              <div className="h-6 sm:h-8 bg-muted rounded mb-1 animate-pulse" />
              <div className="h-3 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Card className="glass border border-white/30 shadow-lg card-hover overflow-hidden relative">
        <CardContent className="p-3 sm:p-4 text-center relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-health-green/10 rounded-full -translate-y-8 translate-x-8"></div>
          <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-health-green mx-auto mb-2 relative z-10" />
          <div className="relative z-10">
            <p className="text-xl sm:text-3xl font-bold text-health-green mb-1">{healthLevel}%</p>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">健康レベル</p>
            {healthLevel >= 80 && (
              <div className="text-xs text-health-green mt-1 font-medium">優秀！</div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="glass border border-white/30 shadow-lg card-hover overflow-hidden relative">
        <CardContent className="p-3 sm:p-4 text-center relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-full -translate-y-8 translate-x-8"></div>
          <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mx-auto mb-2 relative z-10" />
          <div className="relative z-10">
            <p className="text-xl sm:text-3xl font-bold text-red-500 mb-1">{streakDays}</p>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">連続記録日数</p>
            {streakDays >= 7 && (
              <div className="text-xs text-red-500 mt-1 font-medium">素晴らしい継続力！</div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="glass border border-white/30 shadow-lg card-hover overflow-hidden relative">
        <CardContent className="p-3 sm:p-4 text-center relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-health-blue/10 rounded-full -translate-y-8 translate-x-8"></div>
          <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-health-blue mx-auto mb-2 relative z-10" />
          <div className="relative z-10">
            <p className="text-xl sm:text-3xl font-bold text-health-blue mb-1">{(todayCalories / 1000).toFixed(1)}k</p>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">今日のカロリー</p>
            <div className="text-xs text-health-blue mt-1 font-medium">
              目標: 2.0k
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="glass border border-white/30 shadow-lg card-hover overflow-hidden relative">
        <CardContent className="p-3 sm:p-4 text-center relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-character-primary/10 rounded-full -translate-y-8 translate-x-8"></div>
          <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-character-primary mx-auto mb-2 relative z-10" />
          <div className="relative z-10">
            <p className="text-xl sm:text-3xl font-bold text-character-primary mb-1">Lv.{characterLevel}</p>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">バディ成長</p>
            <div className="text-xs text-character-primary mt-1 font-medium">
              次のレベルまで {nextLevelProgress}%
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}